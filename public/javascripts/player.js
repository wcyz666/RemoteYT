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
    }
};

var player = dummyPlayer;

window.el = function(id, rg){
    var range = rg || document;
    return range.getElementById(id);
};
window.qs = function(selector, rg){
    var range = rg || document;
    return range.querySelector(selector);
};
window.qsa = function(selector, rg){
    var range = rg || document;
    return range.querySelectorAll(selector);
};
window.createNode = function(tag, child, attrs){
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
};

Node.prototype.appendChildren = function(children){
    for (var child in children){
        this.appendChild(child);
    }
};
String.prototype.escapeHTML = function() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};
String.prototype.escapeQuotes = function() {
    return this.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};
Array.prototype.removeAt = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
NodeList.prototype.forEach = Array.prototype.forEach;

window.getList = function(){
    var list = JSON.parse(window.localStorage.getItem("playlist")) || {};
    return list[roomNum] || {};
};
window.removeList = function(){
    var list = JSON.parse(window.localStorage.getItem("playlist")) || {};
    delete(list[roomNum]);
    window.localStorage.setItem("playlist", JSON.stringify(list));
};
window.saveList = function(list){
    var originList = JSON.parse(window.localStorage.getItem("playlist")) || {};
    originList[roomNum] = list;
    window.localStorage.setItem("playlist", JSON.stringify(originList));
};
window.removeItem = function (id){
    var list = window.getList();
    delete(list[id]);
    window.saveList(list);
};
window.saveItem = function (id, title){
    var list = window.getList();
    list[id] = title;
    window.saveList(list);
};
window.getVideoIds = function(){
    var list = window.getList();
    var ids = [];
    for (var id in list)
        ids.push(id);
    return ids;
};
window.ajax = function(opt) {
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
};


function MyYT(){
    var outer = this;
    this.playList = qs("ul.nav");
    this.playList.form = qs("form");
    this.current = 0;
    this.playList.ids = getVideoIds();
    this.playList.showError = false;
    this.playList.getList = window.getList;

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
                if (qs('.active', outer.playList))
                    qs('.active', outer.playList).className = "";
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

                if (qs('.active', outer.playList))
                    qs('.active', outer.playList).className = "";
                if (outer.playList.list.length > 0)
                    outer.playList.list[outer.current].className = "active";
                break;
            case "prev":
                outer.current--;
                if (outer.current < 0)
                    outer.current = outer.playList.list.length - 1;
                player.loadVideoById(outer.playList.ids[outer.current]);

                if (qs('.active', outer.playList))
                    qs('.active', outer.playList).className = "";
                if (outer.playList.list.length > 0)
                    outer.playList.list[outer.current].className = "active";

                break;
            case "playById":
                var flag = false;
                console.log(player, data.id);
                for (var _index in outer.playList.ids){
                    var index = parseInt(_index);
                    if (isNaN(_index)) continue;
                    if (data.id == outer.playList.ids[index]) {
                        flag = true;
                    }
                }
                if (!flag)
                    break;
                player.loadVideoById(data.id);
                if (qs('.active', outer.playList))
                    qs('.active', outer.playList).className = "";
                var index = outer.playList.getIndexById(data.id);
                outer.current = index;
                var list = outer.playList.childNodes;
                for (var li in list)
                    if (list[li].firstElementChild && list[li].firstElementChild.getAttribute("name") == data.id) {
                        list[li].className = "active";
                        break;
                    }
                break;
            case "clearall":
                for (var _index in outer.playList.ids) {
                    var index = parseInt(_index);
                    if (isNaN(_index)) continue;
                    if (index != outer.current) {
                        window.removeItem(outer.playList.ids[index]);
                        outer.playList.removeChild(outer.playList.list[index]);
                    }
                }
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
        var flag = false;
        for (var _index in outer.playList.ids) {
            var index = parseInt(_index);
            if (isNaN(_index)) continue;
            if (outer.playList.ids[index] == data.id) {
                flag = true;
                break;
            }
        }
        index = outer.playList.getIndexById(data.id);
        if (flag && outer.playList.list[index].className != "active") {
            window.removeItem(outer.playList.ids[index]);
            outer.playList.ids.removeAt(index);
            var list = outer.playList.childNodes;
            for (var li in list)
                if (list[li].firstElementChild && list[li].firstElementChild.getAttribute("name") == data.id) {
                    outer.playList.removeChild(list[li]);
                    break;
                }

            outer.playList.listBinding();
            index = 0;
            for (var _index in outer.playList.ids) {
                index = parseInt(_index);
                if (isNaN(_index)) continue;
                if (outer.playList.list[index].className == "active")
                    break;
            }
            outer.current = index;
        }
    });

    this.playList.generateLi = function(id, title){
        var closeChar = createNode("span", "×", {"aria-hidden" : true});
        var closeBtn = createNode("button", closeChar, {"class": "close pull-right", "type": "button"});
        var arch = createNode("a", [id + " : " + title, closeBtn], {"name": id});
        var li = createNode("li", arch, {"role": "presentation"});
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
            if (qs('.active', outer.playList))
                qs('.active', outer.playList).className = "";
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
                window.removeItem(outer.playList.ids[index]);
                socket.emit("remove", {"room": roomNum, "id": outer.playList.ids[index], "playlist": window.getList()});
                outer.playList.ids.removeAt(index);
                outer.playList.removeChild(item);
                outer.playList.listBinding();
                index = 0;
                for (var _index in outer.playList.ids) {
                    index = parseInt(_index);
                    if (isNaN(_index)) continue;
                    if (outer.playList.list[index].className == "active")
                        break;
                }
                outer.current = index;
            }
            return false;
        };
    };

    this.playList.listBinding = function () {
        outer.playList.removeChar = qsa("span[aria-hidden]", outer.playList);
        outer.playList.list = qsa("ul.nav li");
    };

    this.playList.getIndexById = function (id){
        var index = 0;
        for (var _index in outer.playList.ids){
            index = parseInt(_index);
            if (isNaN(_index)) continue;
            if (outer.playList.ids[index] == id)
                break;
        }
        return index;
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

        el("clearall").onclick = function(){
            for (var _index in outer.playList.ids) {
                var index = parseInt(_index);
                if (isNaN(_index)) continue;
                if (index != outer.current) {
                    window.removeItem(outer.playList.ids[index]);
                    outer.playList.removeChild(outer.playList.list[index]);
                }
            }
            outer.playList.ids = [outer.playList.ids[outer.current]];
            outer.current = 0;
            outer.playList.listBinding();
            socket.emit("control", {"room": roomNum, "action": "clearall"});
        };

        outer.controllerInit();

        outer.playList.form.onsubmit = function(){
            var id = qs("form input").value;
            if (id.indexOf('http') != -1)
                id = /^[^?]*\?v=(.*)$/i.exec(id)[1];
            qs("form input").value = "";
            for (var _index in outer.playList.ids){
                var index = parseInt(_index);
                if (isNaN(_index)) continue;
                if (id == outer.playList.ids[index]) {
                    alert("Duplicate id!");
                    return false;
                }
            }
            window.ajax({
                method: 'POST',
                url: outer.playList.form.getAttribute('action'),
                data: outer.encodeParam({"vid": id}),
                success: function(json){
                    json = JSON.parse(json);
                    if (json["status"] == 200){
                        outer.addNewVideo(id, json["title"]);
                        socket.emit("add", {"room": roomNum, "id": id, "title": json["title"], "playlist": window.getList()});
                    }
                    else{
                        if (!outer.playList.showError){
                            //var warning = window.createNode("div", "Incorrect Video ID", {"class": "alert alert-danger", "role": "alert"});
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
        window.saveItem(id, title);
        outer.playList.ids.push(id);
        if (player == dummyPlayer && window.innerWidth >= 992)
            player = outer.createPlayer();
    };

    this.init = function() {
        outer.playList.init();
    };

    this.processQR = function(id, url){
        el(id).src = "https://chart.googleapis.com/chart?cht=qr&chs=500x500&chl=" + encodeURIComponent(url);
    };

    this.controllerInit = function(){
        el('play').onclick = function () {
            player.playVideo();
            socket.emit("control", {"room": roomNum, "action":"play"});
        };
        el('pause').onclick = function () {
            player.pauseVideo();
            socket.emit("control", {"room": roomNum, "action":"pause"});
        };
        el('stop').onclick = function () {
            outer.current = 0;
            player.stopVideo();
            player.loadVideoById(outer.playList.ids[0]);
            player.pauseVideo();
            if (qs('.active', outer.playList))
                qs('.active', outer.playList).className = "";
            if (outer.playList.list.length > 0)
                outer.playList.list[0].className = "active";
            socket.emit("control", {"room": roomNum, "action":"stop"});
        };
        el('mute').onclick = function () {
            player.mute();
            socket.emit("control", {"room": roomNum, "action":"mute"});
        };
        el('unmute').onclick = function () {
            player.unMute();
            socket.emit("control", {"room": roomNum, "action":"unmute"});
        };
        el('rewind').onclick = function () {
            currentTime = player.getCurrentTime();
            player.seekTo(currentTime - 2.0);
            socket.emit("control", {"room": roomNum, "action":"rewind"});
        };
        el('forward').onclick = function () {
            currentTime = player.getCurrentTime();
            player.seekTo(currentTime + 2.0);
            socket.emit("control", {"room": roomNum, "action":"forward"});
        };
        el('next').onclick = function () {

            outer.current++;
            if (outer.current == outer.playList.ids.length)
                outer.current = 0;
            player.loadVideoById(outer.playList.ids[outer.current]);
            if (qs('.active', outer.playList))
                qs('.active', outer.playList).className = "";
            if (outer.playList.list.length > 0)
                outer.playList.list[outer.current].className = "active";
            socket.emit("control", {"room": roomNum, "action":"next"});
        };
        el('prev').onclick = function () {
            outer.current--;
            if (outer.current < 0)
                outer.current = outer.playList.list.length - 1;
            player.loadVideoById(outer.playList.ids[outer.current]);
            if (qs('.active', outer.playList))
                qs('.active', outer.playList).className = "";
            if (outer.playList.list.length > 0)
                outer.playList.list[outer.current].className = "active";
            socket.emit("control", {"room": roomNum, "action":"prev"});
        }
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
                                outer.current++;
                                if (outer.current == outer.playList.ids.length)
                                    outer.current = 0;
                                player.loadVideoById(outer.playList.ids[outer.current]);
                                if (qs('.active', outer.playList))
                                    qs('.active', outer.playList).className = "";
                                if (outer.playList.list.length > 0)
                                    outer.playList.list[outer.current].className = "active";
                                console.log("ended");
                                socket.emit("control", {"room": roomNum, "action":"next"});
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

var myTY;

socket.on("suback", function(data){
    var clientCount = Object.keys(data.clientCount).length;
    var tag = document.createElement( 'script' );
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName( 'script' )[ 0 ];
    firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

    if (clientCount == 1) {
        myYT = new MyYT();
        myYT.init();
        socket.emit("synclist", {"room": roomNum, "playlist": window.getList()});
        myYT.processQR("qrcode", window.location.href);
    }
    else{
        window.removeList();
        socket.on("synclist", function (data) {
            window.saveList(data);
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
