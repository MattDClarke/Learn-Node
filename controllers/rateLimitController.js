const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User');

const redisClient = redis.createClient(process.env.REDIS_URL, {
  enable_offline_queue: false
});

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByUsernameAndIP = 3; // TODO - change

const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongAttemptsByIPperDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 1 // Block for 1 minute TODO - change
});

const getUsernameIPkey = (username, ip) => `${username}_${ip}`;

exports.loginRouteRateLimit = async (req, res, next) => {
  const ipAddr = req.ip;
  const usernameIPkey = getUsernameIPkey(req.body.email, ipAddr);
  console.log(usernameIPkey);

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(ipAddr)
  ]);

  let retrySecs = 0;
  // Check if IP or Username + IP is already blocked
  if (
    resSlowByIP !== null &&
    resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay
  ) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
  } else if (
    resUsernameAndIP !== null &&
    resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP
  ) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
  }

  console.log(retrySecs);

  if (retrySecs > 0) {
    res.set('Retry-After', String(retrySecs));
    res
      .status(429)
      .send(`Too Many Requests. Retry after ${retrySecs / 1000} seconds.`);
  } else {
    passport.authenticate('local', async function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        // check if user exists
        const exists = await User.findOne({ email: req.body.email });

        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
          const promises = [limiterSlowBruteByIP.consume(ipAddr)];
          if (exists) {
            console.log('failed login: not authorized');

            // Count failed attempts by Username + IP only for registered users
            promises.push(
              limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey)
            );
          }
          if (!exists) {
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
        console.log('successful login');
        if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
          // Reset on successful authorisation
          await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
        }
        // login
        req.logIn(user, function(err) {
          if (err) {
            return next(err);
          }
          return res.redirect('/');
        });
      }
    })(req, res, next);
  }
};
