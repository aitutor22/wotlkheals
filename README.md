# to run node backend (/healing)
npm run start

# to run vue frontend (/healing/frontend)
npm run serve

Project Organisation notes
 - Vue code is in `frontend`, node backend code in in `src`
 - backend code structured like a django project, with each folder in src representing a standalone module
 - create a .env file in root, and add ACCESS_TOKEN = "xxxx", where XXX refers to your wcl api key



 Temporary Hacks for production steps
 1. Change frontend/vue.config.js to `  publicPath: './',` (in development, comment this out)
 2. In frontend/main.ts, change `axios.defaults.baseURL = '/api/';`
 3. In frontend folder, `npm run build` and copy the /dist folder to the main directory's public folder
 4. Need to add the following to public/index.html to allow for direct access to routes.
 <base href="/" />
