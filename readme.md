## Learn Node - Wes Bos

This is a full stack restaurant application which users can search, geolocate, review and curate their favourite restaurants from around the world https://learnnode.com/.

## My modifications to the application
- added debounce function to search input to limit the frequency of API calls. 
- added server side sanitation of user input using DOM purify
- added get current location button to stores map

## Sample Data

To load sample data, run the following command in your terminal:

```bash
npm run sample
```

If you have previously loaded in this data, you can wipe your database 100% clean with:

```bash
npm run blowitallaway
```

That will populate 16 stores with 3 authors and 41 reviews. The logins for the authors are as follows:

|Name|Email (login)|Password|
|---|---|---|
|Wes Bos|wes@example.com|wes|
|Debbie Downer|debbie@example.com|debbie|
|Beau|beau@example.com|beau|


