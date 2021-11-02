const express = require('express');
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/signUp', (req, res) => {
    const workflow = new (require('events').EventEmitter)();
    
    workflow.on('exception', function (error) {
        res.status(500).send(error);
    });
    
    workflow.on('success', function (response) {
        res.status(200).send(response);
    });
    
    workflow.on('check is email unique', function () {
        isEmailUnique(req.body.email).then((isUnique) => {
            if (isUnique) {
                workflow.emit('create user');
            } else {
                workflow.emit('exception', 'Email already exists.');
            }
        }).catch((error) => {
            workflow.emit('exception', error);
        }); 
    });

    workflow.on('create user', function() {
        createUser(req.body.email, req.body.password).then((user) => {
            if (req.body.isOptInToNewsLetter) {
                workflow.emit('add to mailing list', user);
            } else {
                workflow.emit('send welcome email', user);
            }
        }).catch((error) => {
            workflow.emit('exception', error);
        });
    });

    workflow.on('add to mailing list', function(user) {
        addToMailingList(user).then(() => {
            workflow.emit('send welcome email', user);
        }).catch((error) => {
            workflow.emit('exception', error);
        });
    });

    workflow.on('send welcome email', function(user) {
        sendWelcomeEmail(user).then(() => {
            workflow.emit('success');
        }).catch((error) => {
            workflow.emit('exception', error);
        });
    });

    workflow.emit('check is email unique');
});

app.listen(3000);
