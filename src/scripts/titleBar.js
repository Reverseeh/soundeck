var { ipcRenderer } = require('electron');
var ipc = ipcRenderer;

//CLOSE APP
closeApp.addEventListener('click', () => {
    ipc.send("closeApp");
});

//MINIMIZE APP
minimizeApp.addEventListener('click', () => {
    ipc.send("minimizeApp");
});