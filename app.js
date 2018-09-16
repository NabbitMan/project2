var express = require('express');
var http = require('http');
var https = require('https');
var path = require('path');
var server = require('socket.io');
var pty = require('pty.js');
var fs = require('fs');

var opts = require('optimist')
    .options({
        sslkey: {
            demand: false,
            description: 'path to SSL key'
        },
        sslcert: {
            demand: false,
            description: 'path to SSL certificate'
        },
        sshhost: {
            demand: false,
            description: 'ssh server host'
        },
        sshport: {
            demand: false,
            description: 'ssh server port'
        },
        sshuser: {
            demand: false,
            description: 'ssh user'
        },
        sshauth: {
            demand: false,
            description: 'defaults to "password", you can use "publickey,password" instead'
        },
        port: {
            demand: true,
            alias: 'p',
            description: 'wetty listen port'
        },
    }).boolean('allow_discovery').argv;

var runhttps = false;
var sshport = 22;
var sshhost = 'localhost';
var sshauth = 'password,keyboard-interactive';
var globalsshuser = '';

if (opts.sshport) {
    sshport = opts.sshport;
}

if (opts.sshhost) {
    sshhost = opts.sshhost;
}

if (opts.sshauth) {
    sshauth = opts.sshauth
}

if (opts.sshuser) {
    globalsshuser = opts.sshuser;
}

if (opts.sslkey && opts.sslcert) {
    runhttps = true;
    opts['ssl'] = {};
    opts.ssl['key'] = fs.readFileSync(path.resolve(opts.sslkey));
    opts.ssl['cert'] = fs.readFileSync(path.resolve(opts.sslcert));
}

process.on('uncaughtException', function (e) {
    console.error('Error: ' + e);
});

var httpserv;

var app = express();
app.get('/wetty/ssh/:user', function (req, res) {
    res.sendfile(__dirname + '/public/wetty/index.html');
});
app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/api/tree', function (request, response) {
    var _p;
    if (request.query.id == "#") {
        _p = path.resolve(__dirname, '.');
        processReq(_p, response);
    }
    else {
        if (request.query.id) {
            _p = request.query.id;
            processReq(_p, response);
        }
        else {
            response.json(['No valid data found']);
        }
    }
});

function processReq(_p, response) {
    var resp = [];
    fs.readdir(_p, function (err, list) {
        for (var listItem of list) {
            resp.push(processNode(_p, listItem));
        }
        response.json(resp);
    });
}

function processNode(_p, f) {
    var s = fs.statSync(path.join(_p, f));
    return {
        "id": path.join(_p, f),
        "text": f,
        // "icon": s.isDirectory() ? this.icon : 'fa fa-file',
        "state": {
            "opened": false,
            "disabled": false,
            "selected": false
        },
        "li_addr": {
            "base": path.join(_p, f),
            "isLeaf": !s.isDirectory()
        },
        "children": s.isDirectory()
    };
}

app.get('/api/resource', function (req, res) {
    if (fs.lstatSync(req.query.resource).isFile()) {
        res.send(fs.readFileSync(req.query.resource, 'utf-8'));
    }
});

if (runhttps) {
    httpserv = https.createServer(opts.ssl, app).listen(opts.port, function () {
        console.log('https on port ' + opts.port);
    });
} else {
    httpserv = http.createServer(app).listen(opts.port, function () {
        console.log('http on port ' + opts.port);
    });
}

var io = server(httpserv, { path: '/wetty/socket.io' });
io.on('connection', function (socket) {
    var sshuser = '';
    var request = socket.request;
    console.log((new Date()) + ' Connection accepted.');
    if (match = request.headers.referer.match('/wetty/ssh/.+$')) {
        sshuser = match[0].replace('/wetty/ssh/', '') + '@';
    } else if (globalsshuser) {
        sshuser = globalsshuser + '@';
    }

    var term;
    if (process.getuid() == 0) {
        term = pty.spawn('/usr/bin/env', ['login'], {
            name: 'xterm-256color',
            cols: 80,
            rows: 30
        });
    } else {
        term = pty.spawn('ssh', [sshuser + sshhost, '-p', sshport, '-o', 'PreferredAuthentications=' + sshauth], {
            name: 'xterm-256color',
            cols: 80,
            rows: 30
        });
    }
    console.log((new Date()) + " PID=" + term.pid + " STARTED on behalf of user=" + sshuser)
    term.on('data', function (data) {
        socket.emit('output', data);
    });
    term.on('exit', function (code) {
        console.log((new Date()) + " PID=" + term.pid + " ENDED")
    });
    socket.on('resize', function (data) {
        term.resize(data.col, data.row);
    });
    socket.on('input', function (data) {
        term.write(data);
    });
    socket.on('disconnect', function () {
        term.end();
    });
})
