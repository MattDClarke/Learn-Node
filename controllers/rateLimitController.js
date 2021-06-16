const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const passport = require('passport');

const redisClient = redis.createClient(process.env.REDIS_URL, {
  enable_offline_queue: false
});

redisClient.on('error', err => {
  console.log(err);
  return new Error();
});

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByEmailAndIP = 10;

const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongAttemptsByIPperDay,
  duration: 60 * 60 * 24, // Store number for 1 day
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

const limiterConsecutiveFailsByEmailAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_email_and_ip',
  points: maxConsecutiveFailsByEmailAndIP,
  duration: 60 * 60, // Store number for 1 hour
  blockDuration: 60 * 2 // Block for 2 minutes
});

const getEmailIPkey = (email, ip) => `${email}_${ip}`;

exports.loginRouteRateLimit = async (req, res, next) => {
  const ipAddr = req.ip;
  const emailIPkey = getEmailIPkey(req.body.email, ipAddr);
  console.log(emailIPkey);

  // get keys for attempted login
  const [resEmailAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByEmailAndIP.get(emailIPkey),
    limiterSlowBruteByIP.get(ipAddr)
  ]);

  let retrySecs = 0;
  // Check if IP or Email + IP is already blocked
  if (
    resSlowByIP !== null &&
    resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
  ) {
    // msBeforeNext = Number of milliseconds before next action can be done
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
  } else if (
    resEmailAndIP !== null &&
    resEmailAndIP.consumedPoints > maxConsecutiveFailsByEmailAndIP
  ) {
    retrySecs = Math.round(resEmailAndIP.msBeforeNext / 1000) || 1;
  }

  if (retrySecs > 0) {
    res.set('Retry-After', String(retrySecs));
    res
      .status(429)
      .send(`Too Many Requests. Retry after ${retrySecs} seconds.`);
  } else {
    passport.authenticate('local', async function(err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
          const promises = [limiterSlowBruteByIP.consume(ipAddr)];
          // check user exists and authentication failed because of an incorrect password
          if (info.name === 'IncorrectPasswordError') {
            console.log('failed login: not authorized');
            // Count failed attempts by Email + IP only for registered users
            promises.push(
              limiterConsecutiveFailsByEmailAndIP.consume(emailIPkey)
            );
          }
          // if user does not exist
          if (info.name === 'IncorrectUsernameError') {
            console.log('failed login: user does not exist');
          }

          await Promise.all(promises);
          req.flash('error', 'Email or password is wrong.');
          res.redirect('/login');
        } catch (rlRejected) {
          if (rlRejected instanceof Error) {
            throw rlRejected;
          } else {
            const timeOut =
              String(Math.round(rlRejected.msBeforeNext / 1000)) || 1;
            res.set('Retry-After', timeOut);
            res
              .status(429)
              .send(`Too Many Requests. Retry after ${timeOut} seconds`);
          }
        }
      }
      // If passport authentication successful
      if (user) {
        // Check if user email confirmed
        if (!user.confirmed) {
          req.flash('error', 'You must confirm your email address!');
          return res.redirect('/login');
        }
        console.log('successful login');
        if (resEmailAndIP !== null && resEmailAndIP.consumedPoints > 0) {
          // Reset on successful authorisation
          await limiterConsecutiveFailsByEmailAndIP.delete(emailIPkey);
        }
        // login
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }
          req.flash('info', 'You are now logged in!');
          return res.redirect('/');
        });
      }
    })(req, res, next);
  }
};
