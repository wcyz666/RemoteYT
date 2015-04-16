/**
 * Created by lenovo on 2015/3/29.
 */
var socket = io();
var roomNum = /^.*\/(.*)$/.exec(window.location.href)[1];
socket.emit("subscribe", roomNum);
var dummyPlayer = {
    playVideo: function () {
    },
    stopVideo: function () {
    },
    pauseVideo: function () {
    },
    loadVideoById: function () {
    },
    mute: function () {
    },
    unMute: function () {
    },
    getCurrentTime: function () {
    },
    seekTo: function () {
    },
    seek: function () {
    },
    destroy: function(){

    }
};

var player = dummyPlayer;

var myLib = {
    el : function(id, rg){
        var range = rg || document;
        return range.getElementById(id);
    },
    qs : function(selector, rg){
        var range = rg || document;
        return range.querySelector(selector);
    },
    qsa : function(selector, rg){
        var range = rg || document;
        return range.querySelectorAll(selector);
    },
    createNode : function(tag, child, attrs){
        var outerTag = document.createElement(tag);
        var content;
        if (typeof child === "string"){
            content = document.createTextNode(child);
            outerTag.appendChild(content);
        }
        else {
            if (child instanceof Array){
                for (var _index in child) {
                    var index = parseInt(_index);
                    if (isNaN(_index)) continue;
                    content = child[index];
                    if (typeof content === "string") {
                        content = document.createTextNode(content);
                    }
                    else if (typeof content === "function")
                        continue;
                    outerTag.appendChild(content);
                }
            }
            else{
                outerTag.appendChild(child);
            }
        }

        for (var key in attrs) {
            outerTag.setAttribute(key, attrs[key]);
        }
        return outerTag;
    },
    getList : function(){
        var list = JSON.parse(window.localStorage.getItem("playlist")) || {};
        return list[roomNum] || {};
    },
    removeList : function(){
        var list = JSON.parse(window.localStorage.getItem("playlist")) || {};
        delete(list[roomNum]);
        window.localStorage.setItem("playlist", JSON.stringify(list));
    },
    saveList : function(list){
        var originList = JSON.parse(window.localStorage.getItem("playlist")) || {};
        originList[roomNum] = list;
        window.localStorage.setItem("playlist", JSON.stringify(originList));
    },
    removeItem : function (id){
        var list = this.getList();
        delete(list[id]);
        this.saveList(list);
    },
    saveItem : function (id, title){
        var list = this.getList();
        list[id] = title;
        this.saveList(list);
    },
    getVideoIds : function(){
        var list = this.getList();
        var ids = [];
        for (var id in list)
            ids.push(id);
        return ids;
    },
    ajax : function(opt) {
        opt = opt || {};
        var xhr = (window.XMLHttpRequest)
                ? new XMLHttpRequest()
                : new ActiveXObject("Microsoft.XMLHTTP"),
            async = opt.async !== false,
            success = opt.success || null,
            error = opt.error || function(){alert('AJAX Error: ' + this.status)};

        xhr.open(opt.method || 'GET', opt.url || '', async);

        if (opt.method == 'POST')
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        if (async)
            xhr.onreadystatechange = function(){
                if (xhr.readyState == 4) {
                    var status = xhr.status, response = xhr.responseText;
                    if ((status >= 200 && status < 300) || status == 304 || status == 1223) {
                        success && success(response);
                    } else if (status >= 500)
                        error();
                }
            };
        xhr.onerror = function(){error()};

        xhr.send(opt.data || null);
    }
};

Node.prototype.appendChildren = function(children){
    for (var child in children){
        this.appendChild(child);
    }
};

NodeList.prototype.forEach = Array.prototype.forEach;

function MyYT(){
    var outer = this;
    this.playList = myLib.qs("ul.nav");
    this.playList.form = myLib.qs("form");
    this.current = 0;
    this.playList.ids = myLib.getVideoIds();
    this.playList.showError = false;
    this.playList.getList = myLib.getList;

    socket.on("control", function(data){
        console.log(data);
        switch (data.action){
            case "pause":
                player.pauseVideo();
                break;
            case "play":
                player.playVideo();
                break;
            case "stop":
                outer.current = 0;
                player.stopVideo();
                player.loadVideoById(outer.playList.ids[0]);
                player.pauseVideo();
                if (myLib.qs('.active', outer.playList))
                    myLib.qs('.active', outer.playList).className = "";
                if (outer.playList.list.length > 0)
                    outer.playList.list[0].className = "active";
                break;
            case "mute":
                player.mute();
                break;
            case "unmute":
                player.unMute();
                break;
            case "rewind":
                currentTime = player.getCurrentTime();
                player.seekTo(currentTime - 2.0);
                break;
            case "forward":
                currentTime = player.getCurrentTime();
                player.seekTo(currentTime + 2.0);
                break;
            case "next":
                outer.current++;
                if (outer.current == outer.playList.ids.length)
                    outer.current = 0;
                player.loadVideoById(outer.playList.ids[outer.current]);

                if (myLib.qs('.active', outer.playList))
                    myLib.qs('.active', outer.playList).className = "";
                if (outer.playList.list.length > 0)
                    outer.playList.list[outer.current].className = "active";
                break;
            case "prev":
                outer.current--;
                if (outer.current < 0)
                    outer.current = outer.playList.list.length - 1;
                player.loadVideoById(outer.playList.ids[outer.current]);

                if (myLib.qs('.active', outer.playList))
                    myLib.qs('.active', outer.playList).className = "";
                if (outer.playList.list.length > 0)
                    outer.playList.list[outer.current].className = "active";

                break;
            case "playById":
                var flag = false;
                console.log(player, data.id);
                player.loadVideoById(data.id);
                if (myLib.qs('.active', outer.playList))
                    myLib.qs('.active', outer.playList).className = "";
                var index = outer.playList.getIndexById(data.id);
                outer.current = index;
                outer.playList.childNodes.forEach(function(item, index, array){
                    if (item.firstElementChild && item.firstElementChild.getAttribute("name") == data.id)
                        item.className = "active";
                });
                break;
            case "clearall":
                outer.playList.ids.forEach(function(item, index, array){
                    if (index != outer.current && typeof item == "string") {
                        myLib.removeItem(outer.playList.ids[index]);
                        outer.playList.removeChild(outer.playList.list[index]);
                    }
                });
                outer.playList.ids = [outer.playList.ids[outer.current]];
                outer.current = 0;
                outer.playList.listBinding();

                break;
        }
    });
    socket.on("add", function (data) {
        console.log(data);
        if (!(data.id in outer.playList.ids)){
            outer.addNewVideo(data.id, data.title);
        }
    });
    socket.on("remove", function (data) {
        console.log(data);

        var flag = outer.playList.ids.some(function(item, index, array){
                return item === data.id;
            }
        );
        index = outer.playList.getIndexById(data.id);
        if (flag && outer.playList.list[index].className != "active") {
            myLib.removeItem(outer.playList.ids[index]);
            outer.playList.ids.splice(index, 1);
            var list = outer.playList.childNodes;
            outer.playList.childNodes.forEach(function(item, index, array){
                if (item.firstElementChild && item.firstElementChild.getAttribute("name") == data.id)
                    outer.playList.removeChild(item);
            });
            outer.playList.listBinding();

            outer.playList.list.forEach(function(item, index, array){
                if (item.className == "active")
                    outer.current = index;
            });
        }
    });

    this.playList.generateLi = function(id, title){
        var closeChar = myLib.createNode("span", "×", {"aria-hidden" : true});
        var closeBtn =  myLib.createNode("button", closeChar, {"class": "close pull-right", "type": "button"});
        var arch =  myLib.createNode("a", [id + " : " + title, closeBtn], {"name": id});
        var li =  myLib.createNode("li", arch, {"role": "presentation"});
        outer.playList.closeEventBinding(closeBtn);
        li.style.cursor = "pointer";
        outer.playList.listEventBinding(li);
        return li;
    };

    this.playList.generateHTML = function(localList){
        for (var key in localList) {
            var listItem = outer.playList.generateLi(key, localList[key]);
            outer.playList.appendChild(listItem);
        }
    };

    this.playList.listEventBinding = function(li){
        li.onclick = function(){
            if (myLib.qs('.active', outer.playList))
                myLib.qs('.active', outer.playList).className = "";
            li.className = "active";
            var index = outer.playList.getIndexById( li.firstElementChild.getAttribute("name"));
            outer.current = index;
            player.loadVideoById( outer.playList.ids[index] );
            console.log(outer.playList.ids);
            socket.emit("control", {"room": roomNum, "action": "playById", "id": outer.playList.ids[index]});
            return false;
        };
    };

    this.playList.closeEventBinding = function(closeChar) {
        closeChar.onclick = function (event) {
            event.stopPropagation();
            var index = outer.playList.getIndexById(this.parentNode.getAttribute("name"));
            if (outer.playList.list[index].className != "active") {
                var item = this.parentNode.parentNode;
                myLib.removeItem(outer.playList.ids[index]);
                socket.emit("remove", {"room": roomNum, "id": outer.playList.ids[index], "playlist": myLib.getList()});
                outer.playList.ids.splice(index, 1);
                outer.playList.removeChild(item);
                outer.playList.listBinding();
                outer.playList.list.forEach(function(item, index, array){
                    if (item.className == "active")
                        outer.current = index;
                });
            }
            return false;
        };
    };

    this.playList.listBinding = function () {
        outer.playList.removeChar = myLib.qsa("span[aria-hidden]", outer.playList);
        outer.playList.list = myLib.qsa("ul.nav li");
    };

    this.playList.getIndexById = function (id){
        return outer.playList.ids.indexOf(id);
    };

    this.encodeParam = function(obj) {
        var data = [];
        for (var key in obj)
            data.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        return data.join('&');
    };

    this.playList.init = function(){

        outer.playList.generateHTML(outer.playList.getList());

        outer.playList.listBinding();

        myLib.el("clearall").onclick = function(){
            outer.playList.ids.forEach(function(item, index, array){
                if (index != outer.current && typeof item == "string") {
                    myLib.removeItem(outer.playList.ids[index]);
                    outer.playList.removeChild(outer.playList.list[index]);
                }
            });

            outer.playList.ids = [outer.playList.ids[outer.current]];
            outer.current = 0;
            outer.playList.listBinding();
            socket.emit("control", {"room": roomNum, "action": "clearall"});
        };

        outer.controllerInit();

        outer.playList.form.onsubmit = function(){
            var id = myLib.qs("form input").value;
            if (id.indexOf('http') != -1)
                id = /^[^?]*\?v=(.*)$/i.exec(id.trim())[1];

            myLib.qs("form input").value = "";
            if (outer.playList.ids.some(function(item, index, array){
                    return id == outer.playList.ids[index];
                })) {
                alert("Duplicate id!");
                return false;
            }
            myLib.ajax({
                method: 'POST',
                url: outer.playList.form.getAttribute('action'),
                data: outer.encodeParam({"vid": id}),
                success: function(json){
                    json = JSON.parse(json);
                    if (json["status"] == 200){
                        outer.addNewVideo(id, json["title"]);
                        socket.emit("add", {"room": roomNum, "id": id, "title": json["title"], "playlist": myLib.getList()});
                    }
                    else{
                        if (!outer.playList.showError){
                            //var warning = myLib.createNode("div", "Incorrect Video ID", {"class": "alert alert-danger", "role": "alert"});
                            //outer.playList.appendChild(warning);
                            alert("Incorrect Video ID");
                        }
                    }
                }
            });
            return false;
        };

        if (outer.playList.ids.length > 0)
            outer.playList.firstElementChild.className = "active";
    };

    this.addNewVideo = function(id, title){
        var localList = {};
        localList[id] = title;
        outer.playList.generateHTML(localList);
        outer.playList.listBinding();
        myLib.saveItem(id, title);
        outer.playList.ids.push(id);
        if (player == dummyPlayer && window.innerWidth >= 992)
            player = outer.createPlayer();
    };

    this.init = function() {
        outer.playList.init();
    };

    this.processQR = function(id, url){
        myLib.el(id).src = "https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=" + encodeURIComponent(url);
    };

    this.controllerInit = function(){

        //Use event delegate instead of event binding

        myLib.el("control-panel").addEventListener("click", function(event){
            var target = event.target || window.event.target;
            var targetId = target.id || target.parentNode.id;
            console.log(target);
            switch (targetId){
                case "play":
                    player.playVideo();
                    socket.emit("control", {"room": roomNum, "action":"play"});
                    break;
                case "pause":
                    player.pauseVideo();
                    socket.emit("control", {"room": roomNum, "action":"pause"});
                    break;
                case "stop":
                    outer.current = 0;
                    player.stopVideo();
                    player.loadVideoById(outer.playList.ids[0]);
                    player.pauseVideo();
                    if (myLib.qs('.active', outer.playList))
                        myLib.qs('.active', outer.playList).className = "";
                    if (outer.playList.list.length > 0)
                        outer.playList.list[0].className = "active";
                    socket.emit("control", {"room": roomNum, "action":"stop"});
                    break;
                case "mute":
                    player.mute();
                    socket.emit("control", {"room": roomNum, "action":"mute"});
                    break;
                case "unmute":
                    player.unMute();
                    socket.emit("control", {"room": roomNum, "action":"unmute"});
                    break;
                case "rewind":
                    currentTime = player.getCurrentTime();
                    player.seekTo(currentTime - 2.0);
                    socket.emit("control", {"room": roomNum, "action":"rewind"});
                    break;
                case "forward":
                    currentTime = player.getCurrentTime();
                    player.seekTo(currentTime + 2.0);
                    socket.emit("control", {"room": roomNum, "action":"forward"});
                    break;
                case "next":
                    outer.current++;
                    if (outer.current == outer.playList.ids.length)
                        outer.current = 0;
                    player.loadVideoById(outer.playList.ids[outer.current]);
                    if (myLib.qs('.active', outer.playList))
                        myLib.qs('.active', outer.playList).className = "";
                    if (outer.playList.list.length > 0)
                        outer.playList.list[outer.current].className = "active";
                    socket.emit("control", {"room": roomNum, "action":"next"});
                    break;
                case "prev":
                    outer.current--;
                    if (outer.current < 0)
                        outer.current = outer.playList.list.length - 1;
                    player.loadVideoById(outer.playList.ids[outer.current]);
                    if (myLib.qs('.active', outer.playList))
                        myLib.qs('.active', outer.playList).className = "";
                    if (outer.playList.list.length > 0)
                        outer.playList.list[outer.current].className = "active";
                    socket.emit("control", {"room": roomNum, "action":"prev"});
                    break;
            };

        }, false);

    };

    this.createPlayer = function(){
        var player;

        if (outer.playList.ids.length > 0) {
            player = new YT.Player('player', {
                height: '390',
                width: '640',
                playerVars: {'controls': 0},
                videoId: outer.playList.ids[outer.current],
                events: {
                    'onReady': function () {
                    },
                    'onStateChange': function onPlayerStateChange(event){
                        switch( event.data ) {
                            case YT.PlayerState.ENDED:
                                var nextBtn = myLib.el("next");
                                var eventClick = new MouseEvent("click", {"bubbles": true});
                                console.log(eventClick);
                                nextBtn.dispatchEvent(eventClick);
                                break;
                            case YT.PlayerState.PLAYING:
                                // ...
                                break;
                            case YT.PlayerState.PAUSED:
                                // ...
                                break;
                            case YT.PlayerState.BUFFERING:
                                // ...
                                break;
                            case YT.PlayerState.CUED:
                                // ...
                                break;
                            default:
                            // ...
                        }
                    }
                }
            })
        }
        else{
            player = dummyPlayer;
        }
        return player;
    };

}

socket.on("suback", function(data){
    var clientCount = Object.keys(data.clientCount).length;
    var tag = document.createElement( 'script' );
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName( 'script' )[ 0 ];
    firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

    if (clientCount == 1) {
        myYT = new MyYT();
        myYT.init();
        socket.emit("synclist", {"room": roomNum, "playlist": myLib.getList()});
        myYT.processQR("qrcode", window.location.href);
    }
    else{
        myLib.removeList();
        socket.on("synclist", function (data) {
            myLib.saveList(data);
            console.log(data);
            myYT = new MyYT();
            myYT.init();
            myYT.processQR("qrcode", window.location.href);
        });
        socket.emit("sync", {"room": roomNum});
    }
});

function onYouTubeIframeAPIReady() {
    if ( window.innerWidth >= 992 ) {
        player = myYT.createPlayer();
    }
}

window.addEventListener( 'resize', function() {
    if ( window.innerWidth >= 992 ) {
        if ( player == dummyPlayer ) {
            player = myYT.createPlayer();
        }
    } else {
        player.destroy(); // Destroy the video player
        player = dummyPlayer;
    }
});
