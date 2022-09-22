const express = require('express');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

const routes = require('./routes');

const app = express();

app.use(express.json());
app.use(awsServerlessExpressMiddleware.eventContext())

app.use((req, res, next) => {
  if(req.apiGateway && req.apiGateway.event && req.apiGateway.event.requestContext 
    && req.apiGateway.event.requestContext.authorizer && req.apiGateway.event.requestContext.authorizer.claims) {
    const claims = req.apiGateway.event.requestContext.authorizer.claims;
    req.user = {
      id: claims.sub,
      userName: claims['cognito:username'],
      first_name: claims.given_name,
      last_name: claims.family_name,
      pic: claims.picture
    }
    next();
  } else {
    if(process.env.NODE_ENV==='local') {
      req.user = {
        //id: '0274d8c4-e5dd-4559-ae53-e5aba185a13c' //arif
        id: '67be443e-1366-4660-8a4f-86311009d62d' //rustam
        //id: 'a1289f46-dd45-4fd8-ac73-2115a53a01bc' //abdul
      };
      next();
    } else {
      const error = new Error('Unauthorised');
      error.status = 403;
      next(error);
    }
  }
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
