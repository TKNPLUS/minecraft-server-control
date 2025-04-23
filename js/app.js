const socket = io();
document.getElementById('start').onclick = () => socket.emit('action',{type:'start'});
document.getElementById('stop').onclick = () => socket.emit('action',{type:'stop'});
const send = document.getElementById('send');
if(send){ send.onclick = () => {
  const cmd = document.getElementById('cmd').value;
  socket.emit('action',{type:'command', command:cmd});
}}
socket.on('log', ({level,msg}) => {
  const line = document.createElement('div');
  line.textContent = msg;
  if(level==='warn') line.style.color='orange';
  if(level==='error') line.style.color='red';
  if(level==='info') line.style.color='green';
  document.getElementById('log').append(line);
});
