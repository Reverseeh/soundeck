const fs = require("fs");
const path = require('path');
var { ipcRenderer } = require('electron');
var ipc = ipcRenderer;

var page = 1;
var folder = "home";
var idToEdit = 0;
var buttonIDtoEdit = 0;
const audios = [];
const globalVolume = 0.25;

ipc.invoke('getPath').then((response) => {
    if(!fs.existsSync(path.join(response, 'buttons.json'))) {
        fs.writeFileSync(path.join(response, 'buttons.json'), JSON.stringify([]));
    }
});

async function loadButtons(folder, page) {
    const userPath = await ipc.invoke('getPath');
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    //CLEAR BUTTONS
    for(let i = 1; i <= 15; i++) {
        $(`#${i}`).css({"border": "2px solid rgba(255, 255, 255, 0.40)", "background": "rgba(255, 255, 255, 0.08)"});
        $(`#img-${i}`).prop("src", "");
    }
    //GET PAGE
    const pageToAdd = eval(`(${page}-1) *15`);
    //FILTER BUTTONS
    const buttons = data.filter(buttons => buttons["parent"] == folder).filter(buttons => +buttons["position"] > pageToAdd && +buttons["position"] <= eval(`(${page}) *15`));
    //EDIT BUTTONS
    for(const x in buttons) {
        const button = buttons[x];
        $(`#${+button["position"] - pageToAdd}`).css({"border": `2px solid rgba(${button["color"]}, 0.40)`, "background": `rgba(${button["color"]}, 0.08)`});
        if(button["icon"] != "") {
            $(`#img-${+button["position"] - pageToAdd}`).prop("src", `${button['icon']}`);
        } else {
            if(button["type"] == "sound") {
                $(`#img-${+button["position"] - pageToAdd}`).prop("src", `assets/sound-white.svg`);
            } else if(button["type"] == "folder") {
                $(`#img-${+button["position"] - pageToAdd}`).prop("src", `assets/folder-white.svg`);
            }
        }
    }
}

loadButtons(folder, page);

//GET CLICK ON BUTTON
$(document).on("click", async function (event) {
    const userPath = await ipc.invoke('getPath');
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    const id = event.target.id.replace("img-", "");
    const pageToAdd = eval(`(${page}-1) *15`);
    //REMOVE MENU
    if(id !== "slider-button") {
        if($(".add-button-menu").css("display") !== "none" || $(".edit-button-menu").css("display") !== "none") {
            $(".add-button-menu").css({"display": "none"});
            $(".edit-button-menu").css({"display": "none"});
            $(".main").css({"-webkit-app-region": "drag"});
        }
    }
    //GO TO NEXT PAGE
    if(id == "nextPage") {
        page += 1;
        loadButtons(folder, page);
        $('#prevPage').prop('disabled', false);
    //GO TO PREVIOUS PAGE
    } else if(id == "prevPage" && $('#prevPage').prop('disabled') == false) {
        page -= 1;
        loadButtons(folder, page);
        if(page == 1) {
            $('#prevPage').prop('disabled', true);
        }
    //CLOSE FOLDER
    } else if(id == "closeFolder" && $('#closeFolder').prop('disabled') == false) {
        folder = data.filter(buttons => buttons["id"] == folder)[0]["parent"];
        page = 1;
        $('#prevPage').prop('disabled', true);
        loadButtons(folder, page);
        if(data.filter(buttons => buttons["parent"] == folder)[0]["parent"] == "home") {
            $('#closeFolder').prop('disabled', true);
        }
    //GO TO NEXT PAGE
    } else if(id == "stopall") {
        for(var i in audios) {
            audios[i].pause();
            audios[i].currentTime = 0;
        }
    //OPEN ADD SOUND MODAL
    } else if(id == "add-sound") {
        $(".soundboard").css({"display": "none"});
        $(".modals").css({"display": "flex"});
        $(".add-button-modal").css({"display": "flex"});
        $("#settings").prop('disabled', true);
    //OPEN ADD FOLDER MODAL
    } else if(id == "add-folder") {
        $(".soundboard").css({"display": "none"});
        $(".modals").css({"display": "flex"});
        $(".add-folder-modal").css({"display": "flex"});
        $("#settings").prop('disabled', true);
    //CHOOSE IMAGE PATH
    } else if(id == "button-image-path") {
        var input = document.createElement('input');
        input.type = 'file';
        input.id = 'input-image-path';
        input.accept = '.gif,.jpg,.jpeg,.png';
        input.onchange = e => { 
            var file = e.target.files[0];
            if($(".add-button-modal").css("display") == "none") {
                $('#folder-image-path').val(file.path);
            } else {
                $('#image-path').val(file.path);
            }
        }
        input.click();
    //CHOOSE SOUND PATH
    } else if(id == "button-sound-path") {
        var input = document.createElement('input');
        input.type = 'file';
        input.id = 'input-image-path';
        input.accept = '.mp3,.wav';
        input.onchange = e => { 
            var file = e.target.files[0];
            $('#sound-path').val(file.path);
        }
        input.click();
    //DONE SOUND BUTTON
    } else if(id == "sound-done") {
        if($("#sound-path").val() == "") { var loop = false; } else { var loop = $("#button-loop").is(':checked'); }
        if(idToEdit !== false) {
            data[data.length] = {
                id: uuidv4(),
                type: "sound",
                parent: folder,
                name: $("#button-name").val(),
                position: idToEdit + pageToAdd,
                color: hex_to_RGB($("#button-color").val()),
                icon: $("#image-path").val(),
                sound: $("#sound-path").val(),
                volume: "false",
                loop: loop
            };
            fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(data));
        } else {
            const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
            for(var i in audios) {
                if(audios[i].src.replace("file:///", "").replace(/\/+/g, "\\").replace(/%20+/g, " ") == button['sound']) {
                    audios[i].pause();
                    audios[i].currentTime = 0;
                }
            }

            button['name'] = $("#button-name").val();
            button['color'] = hex_to_RGB($("#button-color").val());
            button['icon'] = $("#image-path").val();
            button['sound'] = $("#sound-path").val();
            button['loop'] = loop;
            fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(data));
        }

        $(".soundboard").css({"display": "flex"});
        $(".modals").css({"display": "none"});
        $(".add-button-modal").css({"display": "none"});
        $("#settings").prop('disabled', false);

        $("#button-name").val("");
        $("#button-color").val("#000000");
        $("#sound-path").val("");
        $("#image-path").val("");
        $("#button-loop").prop('checked', false);

        loadButtons(folder, page);
    //CLOSE SOUND BUTTON
    } else if(id == "sound-close") {
        $(".soundboard").css({"display": "flex"});
        $(".modals").css({"display": "none"});
        $(".add-button-modal").css({"display": "none"});
        $("#settings").prop('disabled', false);

        $("#button-name").val("");
        $("#button-color").val("#000000");
        $("#sound-path").val("");
        $("#image-path").val("");
        $("#button-loop").prop('checked', false);

        loadButtons(folder, page);
    //DONE FOLDER BUTTON
    } else if(id == "folder-done") {
        if(idToEdit !== false) {
            data[data.length] = {
                id: uuidv4(),
                type: "folder",
                parent: folder,
                name: $("#folder-name").val(),
                position: idToEdit + pageToAdd,
                color: hex_to_RGB($("#folder-color").val()),
                icon: $("#folder-image-path").val()
            };
            fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(data));
        } else {
            const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
            button['name'] = $("#folder-name").val();
            button['color'] = hex_to_RGB($("#folder-color").val());
            button['icon'] = $("#folder-image-path").val();
            fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(data));
        }

        $(".soundboard").css({"display": "flex"});
        $(".modals").css({"display": "none"});
        $(".add-folder-modal").css({"display": "none"});
        $("#settings").prop('disabled', false);

        $("#folder-name").val("");
        $("#folder-color").val("#000000");
        $("#folder-image-path").val("");

        loadButtons(folder, page);
    //CLOSE FOLDER BUTTON
    } else if(id == "folder-close") {
        $(".soundboard").css({"display": "flex"});
        $(".modals").css({"display": "none"});
        $(".add-folder-modal").css({"display": "none"});
        $("#settings").prop('disabled', false);

        $("#folder-name").val("");
        $("#folder-color").val("#000000");
        $("#folder-image-path").val("");

        loadButtons(folder, page);
    //STOP SINGLE BUTTON
    } else if(id == "stop-button") {
        const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
        for(var i in audios) {
            if(audios[i].src.replace("file:///", "").replace(/\/+/g, "\\").replace(/%20+/g, " ") == button['sound']) {
                audios[i].pause();
                audios[i].currentTime = 0;
            }
        }
    //DELETE BUTTON
    } else if(id == "delete-button") {
        const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
        if(button['type'] == "folder") {
            for(var x in data.filter(button => button['parent'] == buttonIDtoEdit)) {
                const button = data.filter(button => button['parent'] == buttonIDtoEdit)[x];
                console.log(button);
                for(var i in audios) {
                    if(audios[i].src.replace("file:///", "").replace(/\/+/g, "\\").replace(/%20+/g, " ") == button['sound']) {
                        audios[i].pause();
                        audios[i].currentTime = 0;
                    }
                }
            }
            var buttonsFiltered = data.filter(button => button['id'] != buttonIDtoEdit).filter(buttonx => buttonx['parent'] != buttonIDtoEdit);
        } else if(button['type'] == "sound") {
            for(var i in audios) {
                if(audios[i].src.replace("file:///", "").replace(/\/+/g, "\\").replace(/%20+/g, " ") == button['sound']) {
                    audios[i].pause();
                    audios[i].currentTime = 0;
                }
            }
            var buttonsFiltered = data.filter(button => button['id'] != buttonIDtoEdit);
        }
        fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(buttonsFiltered));
        loadButtons(folder, page);
    //EDIT BUTTON
    } else if(id == "edit-button") {
        const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
        idToEdit = false;
        if(button["type"] == "sound") {
            $(".soundboard").css({"display": "none"});
            $(".modals").css({"display": "flex"});
            $(".add-button-modal").css({"display": "flex"});
            $("#settings").prop('disabled', true);

            $("#button-name").val(button["name"]);
            $("#button-color").val(rgbToHex(button["color"].split(", ")[0], button["color"].split(", ")[1], button["color"].split(", ")[2]));
            $("#sound-path").val(button["sound"]);
            $("#image-path").val(button["icon"]);
            $("#button-loop").prop('checked', button["loop"]);
        } else if(button["type"] == "folder") {
            $(".soundboard").css({"display": "none"});
            $(".modals").css({"display": "flex"});
            $(".add-folder-modal").css({"display": "flex"});
            $("#settings").prop('disabled', true);

            $("#folder-name").val(button["name"]);
            $("#folder-color").val(rgbToHex(button["color"].split(", ")[0], button["color"].split(", ")[1], button["color"].split(", ")[2]));
            $("#folder-image-path").val(button["icon"]);
        }
    //USE BUTTON
    } else if(data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`)).length > 0) {
        const button = data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`))[0];
        //PLAY SOUND
        if(button["type"] == "sound") {
            var sound = button['sound'];
            if(button['sound'] == "") { sound = "./assets/Suikoden Quack.mp3"; }
            
            var audio = new Audio(sound);
            audios.push(audio);
            if(button["volume"] == "false") {
                audio.volume = globalVolume;
            } else {
                audio.volume = +button["volume"];
            }
            audio.loop = button['loop'];
            audio.play();
        //OPEN FOLDER
        } else if(button["type"] == "folder") {
            folder = button["id"];
            page = 1;
            loadButtons(folder, page);
            $('#prevPage').prop('disabled', true);
            $('#closeFolder').prop('disabled', false);
        }
    //CREATE NEW BUTTON
    } else if(+id > 0) {
        idToEdit = +id;
        var mouseY = event.pageY;
        var mouseX = event.pageX;
        if(+event.pageY >= 300) { mouseY = +event.pageY - 66; }
        $(".main").css({"-webkit-app-region": "no-drag"});
        $('.add-button-menu').css({"top": mouseY, "left": mouseX, "display": "flex"});
    }
});

//RIGHT CLICK MENU
$(document).on("contextmenu", async function (event) {
    const userPath = await ipc.invoke('getPath');
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    const id = event.target.id.replace("img-", "");
    const pageToAdd = eval(`(${page}-1) *15`);
    if(data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`)).length > 0) {
        const button = data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`))[0];
        $(".add-button-menu").css({"display": "none"});
        buttonIDtoEdit = button["id"];
        var mouseY = event.pageY;
        var mouseX = event.pageX;
        if(+event.pageY >= 300) { mouseY = +event.pageY - 66; }
        $(".main").css({"-webkit-app-region": "no-drag"});

        if(button["volume"] == "false") { var volume = globalVolume * 100; } else { var volume = button["volume"] * 100; }
        $("#slider-button").val(volume);

        if(button["type"] == "folder") {
            $('.slider-button').css({"display": "none"});
            $('#stop-button').css({"display": "none"});
        } else if(button["type"] == "sound") {
            $('.slider-button').css({"display": "flex"});
            $('#stop-button').css({"display": "flex"});
        }
        $('.edit-button-menu').css({"top": mouseY, "left": mouseX, "display": "flex"});
    }
});

//AUDIO SLIDER
$("#slider-button").on("input change", async function(event) {
    const userPath = await ipc.invoke('getPath');
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
    if(button["sound"] !== "") {
        button['volume'] = event.target.value / 100;
        fs.writeFileSync(path.join(userPath, 'buttons.json'), JSON.stringify(data));

        for(var i in audios) {
            if(audios[i].src.replace("file:///", "").replace(/\/+/g, "\\").replace(/%20+/g, " ") == button['sound']) {
                audios[i].volume = event.target.value / 100;
            }
        }
    }
});

$("#slider-button").on("change", async function() {
    const userPath = await ipc.invoke('getPath');
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    const button = data.filter(buttons => buttons["id"] == buttonIDtoEdit)[0];
    if(button["sound"] == "") {
        $("#slider-button").val(globalVolume * 100);
    }
});

//CHANGE TITLE BUTTON NAME ON HOVER
$(document).on("mouseover",".content", async function (event) {
    const userPath = await ipc.invoke('getPath');
    const id = event.target.id.replace("img-", "");
    const data = JSON.parse(fs.readFileSync(path.join(userPath, 'buttons.json'), 'utf8'));
    const pageToAdd = eval(`(${page}-1) *15`);
    if(data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`)).length > 0) {
        const button = data.filter(buttons => buttons["parent"] == folder).filter(buttons => buttons["position"] == eval(`${id} + ${pageToAdd}`))[0];
        $(`#titleInfo`).html(`${button['name']}`);
        $(`#titleInfo`).css({"display": "flex"});
    } else { 
        $(`#titleInfo`).css({"display": "none"});
    }
});

$(document).on("mouseout",".content", function () {
    $(`#titleInfo`).css({"display": "none"});
});


//FUNZIONI
function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function hex_to_RGB(hex) {
    var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}