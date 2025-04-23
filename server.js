const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Client } = require('ssh2');
const decryptConfig = require('./decrypt');
const config = decryptConfig();

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'change-this-secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
  const user = config.users.find(u => u.username === username && u.password === password);
  return user ? done(null, user) : done(null, false);
}));

passport.serializeUser((user, done) => done(null, user.username));
passport.deserializeUser((username, done) => {
  const user = config.users.find(u => u.username === username);
  done(null, user || false);
});

function ensureRole(role) {
  return (req, res, next) => {
    if (req.isAuthenticated() && (req.user.role === role || req.user.role === 'admin')) return next();
    res.redirect('/');
  };
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/logs',
  failureRedirect: '/'
}));

app.get('/logs', ensureRole('guest'), (req, res) => {
  res.render('logs', { user: req.user });
});

const server = require('http').Server(app);
const io = require('socket.io')(server);

io.use((socket, next) => {
  session({ secret: 'change-this-secret', resave: false, saveUninitialized: false })(socket.request, {}, next);
});

io.on('connection', socket => {
  socket.on('action', ({ type, command }) => {
    runSSH(type, command, socket, socket.request.session.passport.user.role);
  });
});

function runSSH(type, command, socket, role) {
  const conn = new Client();
  conn.on('ready', () => {
    conn.exec('cd ~/Server && ./run.sh &', (err, stream) => {
      if (err) return socket.emit('log', { level: 'error', msg: err.message });
      stream.on('data', data => parseAndEmitLog(data.toString(), socket));
      socket.on('stop', () => stream.write('stop\n'));
      if (role === 'admin' && type === 'command') {
        stream.write(`${command}\n`);
      }
    });
  }).connect({
    host: config.ssh.host,
    port: config.ssh.port,
    username: config.ssh.username,
    passphrase: config.ssh.passphrase
  });
}

function parseAndEmitLog(line, socket) {
  let level = 'info';
  if (/\[\/WARN\]/.test(line)) level = 'warn';
  if (/\[\/ERROR\]/.test(line)) level = 'error';
  socket.emit('log', { level, msg: line });
}

server.listen(3000, () => console.log('Listening on http://localhost:3000'));