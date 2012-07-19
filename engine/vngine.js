/************************************************************
 * VNgine - Visual Novel Engine written in JavaScript       *
 * Version 0.6 dev                                          *
 * (c) 2012 Soulweaver                                      *
 ************************************************************/
 
var VNGINE_VERSION = "0.6";
var VNGINE_EVENT_SET_VERSION = 1;

var NovelCurrentSceneFile = "";
var NovelCurrentSceneHash = "";
var NovelRunState = 0;
var NovelHistoryPoint = 0;
var NovelScene = [];
var NovelLabels = {};
var NovelAudio = {};
var MsgHistory = [];
var NameHistory = [];
var NovelHistorySavedState = "";
var NovelHistorySavedStateName = "";
var TextSpeed = 30;
var CtrlSkipped = false;
var Variables = {
    choice: -1,
    lname: "Okazaki",
    fname: "Tomoya"
};
var OverrideStep = false;
var NovelAutoSave = "";

function VNgineError(msg,param,fatal) {
    fatal = typeof fatal !== 'undefined' ? fatal : false;
    if (fatal) {
        alert('VNgine fatal error: ' + msg + ' (parameter string "' + param + '"). Execution halted.');
    } else {
        var c = confirm('VNgine error: ' + msg + ' (parameter string "' + param + '")\n\nContinue anyway? (Continuing after an error might yield unexpected results.)');
        VNgineLog("VNgine error: " + msg + ", parameters " + param);
        if (c===true) { initStep(); }
    }
}
function VNgineLog(msg) {
    console.log(msg);
}

$(document).ready(function(){
    VNgineLog("VNgine version " + VNGINE_VERSION + " &copy;2012 Soulweaver");
    $('#footer').append('<div id="copyright">VNgine version ' + VNGINE_VERSION + ' &copy;2012 Soulweaver</div>');
    var hash = window.location.hash;
    if ((hash == "") || (hash === undefined)) {
        NovelID = "default";
    } else {
        NovelID = hash.replace("#","");
    }
    $('head').append('<link rel="stylesheet" type="text/css" href="vn/' + NovelID + '/default.css">');
    readScene("default.dat","start",false);
});
String.prototype.ltrim = function() {
    return this.replace(/^\s+/,"");
}

String.prototype.toMurmurHash = function() {
        /**
        * JS Implementation of MurmurHash2
        *
        * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
        * @see http://github.com/garycourt/murmurhash-js
        * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
        * @see http://sites.google.com/site/murmurhash/
        *
        * @param {string} str ASCII only
        * @param {number} seed Positive integer only
        * @return {number} 32-bit positive integer hash
        */
    var str = this;
    var seed = 27038;
    var l = str.length,
    h = seed ^ l,
    i = 0,
    k;
    
    while (l >= 4) {
        k = ((str.charCodeAt(i) & 0xff)) | ((str.charCodeAt(++i) & 0xff) << 8) |
            ((str.charCodeAt(++i) & 0xff) << 16) | ((str.charCodeAt(++i) & 0xff) << 24);
      
        k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        k ^= k >>> 24;
        k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));

        h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

        l -= 4; ++i;
    }
      
    switch (l) {
    case 3: h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    case 2: h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1: h ^= (str.charCodeAt(i) & 0xff);
            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    }

    h ^= h >>> 13;
    h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
    h ^= h >>> 15;

    return (h >>> 0).toString(16);
}


$(".background,.character,.overlay,#messagename_container").live("click", function() {
    if ($('#messagebox_container')[0].style.display == "none") {
        $('#messagebox_container').toggle();
        $('#messagename_container').toggle();
        $('#container').toggleClass("clickable");
    } else {
        if (!($('#container').hasClass("clickable"))) {
            TextSpeed = 0;
        } else {
            if ($('#messagenext').length > 0) {
                $('#messagenext').remove();
                initStep();
            } else {
                if ($('#messagebox_container').hasClass("history")) {
                    $('#messagebox_container').removeClass("history");
                    $('#history_back, #history_forward').removeClass("disabled");
                    $('#messagebox').html(NovelHistorySavedState);
                    $('#messagename_container').html(NovelHistorySavedStateName);
                }
            }
        }
    }
});

$(document).keydown(function(event) {
    switch(event.which) {
        case 17:
            TextSpeed = 0;
            CtrlSkipped = true;
            if (($('#messagenext').length > 0) && ($('#container').hasClass("clickable"))) {
                initStep();
            }
            break;
        case 13:
            event.preventDefault();
            $("#messagename_container").click();
            break;
        case 32:
            event.preventDefault();
            $("#hide_msgbox").click();
            break;
        case 33:
            event.preventDefault();
            // previous in history (PgUp)
            $("#history_back").click();
            break;
        case 34:
            event.preventDefault();
            // next in history (PgDn)
            $("#history_forward").click();
            break;
    }
});

$('#history_back').live("click", function() {
    if ($('#messagebox_container').hasClass('history')) {
        NovelHistoryPoint = Math.min(MsgHistory.length-1,NovelHistoryPoint+1);
        showHistoryItem(NovelHistoryPoint);
    } else {
        if ($('#messagenext').length > 0) {
            NovelHistoryPoint = 0;
            storeCurrentState();
            showHistoryItem(0);
        }
    }
});
$('#history_forward').live("click", function() {
    if ($('#messagebox_container').hasClass('history')) {
        NovelHistoryPoint = Math.max(0,NovelHistoryPoint-1);
        showHistoryItem(NovelHistoryPoint);
    } else {
        if ($('#messagenext').length > 0) {
            NovelHistoryPoint = 0;
            storeCurrentState();
            showHistoryItem(0);
        }
    }
});
$('#hide_msgbox').live("click", function() {
    if ($('#messagenext,.choice').length > 0) {
        $('#messagebox_container').toggle();
        $('#messagename_container').toggle();
        $('#container').toggleClass("clickable");
    }
});

function showHelp() {
    $('.footerbox:not(#help)').slideUp(1500);
    $('#help').slideToggle(1500);
}
function showSave() {
    $('.footerbox:not(#saveform)').slideUp(1500);
    $('#saveform').slideToggle(1500);
}
function showLoad() {
    $('.footerbox:not(#loadform)').slideUp(1500);
    $('#loadform').slideToggle(1500);
}

function addHistoryItem() {
    MsgHistory.splice(0,0,$('#messagebox').html());
    NameHistory.splice(0,0,$('#messagename_container').html());
}
function showHistoryItem(index) {
    $('#messagebox_container').addClass('history');
    $('#messagebox').html(MsgHistory[index]);
    $('#messagename_container').html(NameHistory[index]);
    $('#messagename').addClass('history');
    $('#history_back, #history_forward').removeClass("disabled");
    if (index == 0) { $('#history_forward').addClass("disabled"); }
    if (index + 1 == MsgHistory.length) { $('#history_back').addClass("disabled"); }
}
function storeCurrentState() {
    NovelHistorySavedState = $('#messagebox').html();
    NovelHistorySavedStateName = $('#messagename_container').html();
}

/* ID factory */
var IDs = {
    BGID: 0,
    CharID: 0,
    OverlayID: 0,
    MediaID: 0,
    getBGID: function(){ return this.BGID++; },
    getCharID: function(){ return this.CharID++; },
    getOverlayID: function(){ return this.OverlayID++; },
    getMediaID: function(){ return this.MediaID++; },
    reInitialize: function(){ this.BGID = 0; this.CharID = 0; this.OverlayID = 0; this.MediaID = 0; }
}

function readScene(filename,label,loading) {
    loading = typeof loading !== 'undefined' ? loading : false;
    label = typeof label !== 'undefined' ? label : "start";
    $('#container').addClass("busy");
    $.get("vn/" + NovelID + "/scene/" + filename, function(data) {
        NovelCurrentSceneHash = data.toMurmurHash();
        NovelScene = data.split(/\r?\n/);
        VNgineLog("Successfully read scene from " + filename);
        NovelLabels = {start: 0};
        NovelAudio = {};
        $.each(NovelScene, function(key,value) {
            var event = value.ltrim().split(" ").splice(0,1)[0];
            var param = value.ltrim().split(" ").slice(1).join(" ");
            switch(event) {
                case 'label': NovelLabels[param] = key; break;
                case 'ending':
                case 'playmus':
                    if (NovelAudio[param] == undefined) {
                        addPreloadMusic(param);
                    }
                    break;
            }
        });
        $('#container').removeClass("busy");
        NovelRunState = NovelLabels[label];
        NovelCurrentSceneFile = filename;
        initStep();
        if (loading) { loadSavedStateFileRead(); }
    }).error(function() {
        VNgineError("Failed to read the scene file.",filename,true);
    });
}

function readLine(line) {
    NovelRunState = typeof line !== 'undefined' ? line : NovelRunState;
    if (NovelScene[NovelRunState] === undefined) {
        VNgineError("premature end of scene script", "N/A",true);
        $('#messagebox').html("");
        $('#messagename').html("");
        return "nop";
    }
    return NovelScene[NovelRunState++].ltrim();
}

function stopMusic() {
    $('audio.bgm').each(function() {
        this.pause();
    });
    //$('audio.bgm').remove();
}
function addPreloadMusic(filename) {
    id = IDs.getMediaID();
    $('#messages').append('<div class="preloader" id="preload_' + id + '"><progress max="100"></progress>'
                        + ' Preloading: ' + filename
                        + '<audio class="bgm" src="vn/' + NovelID +'/media/' + filename + '" preload="auto"'
                        + 'id="media_' + id + '" loop="loop"></div>');
    NovelAudio[filename] = id;
    $('#preload_' + id).hide().slideDown(1000);
    $('#preload_' + id + ' > audio')[0].load();
    $('#preload_' + id + ' > audio').bind("progress",function() {
        if ((this.duration > 0) && (this.buffered.length > 0)) {
            $(this).parent().children('progress').attr("value",this.buffered.end(0) / this.duration * 100);
            if (this.buffered.end(0) == this.duration) {
                $(this).parent().slideUp(1000);
            }
        }
    });
}

function initStep(timeout) {
    timeout = typeof timeout !== 'undefined' ? timeout : 0;
    if (!OverrideStep) {
        $('#container').removeClass("busy");
        setTimeout(nextline,timeout);
    }
}

function evaluateExpression(expr) {
    if (typeof expr === 'undefined') {
        VNgineError("No expression was sent to evaluateExpression for handling.","N/A",false);
    } else {
        VNgineLog("ExprEval: new loop using the expression " + expr);
        while ((expr.indexOf("(") >= 0) && (expr.indexOf(")") >= 0)) {
            var start = expr.indexOf("(");
            var end = start + 1;
            var depth = 1;
            while ((depth > 0) && (end < expr.length)) {
                if (expr[end] == "(") { depth++; VNgineLog("ExprEval: went up a depth level at pos " + end + ": " + depth); }
                if (expr[end] == ")") { depth--; VNgineLog("ExprEval: went down a depth level at pos " + end + ": " + depth); }
                end++;
            }
            var str = evaluateExpression(expr.slice(start+1,end-1));
            expr = expr.slice(0,start) + str + expr.slice(end);
        }
        if (expr.slice(0,2) == "--") {
            expr = expr.slice(2);
        }
        while ((expr.indexOf("&&") >= 0) || (expr.indexOf("||") >= 0) || (expr.indexOf("^^") >= 0)) {
            var match = expr.match(/(-?[@\w]+?(?:\.\d+?)?)\s*?([&\|\^]{2})\s*?(-?[@\w]+?(?:\.\d+?)?)\b/);
            if (match === null) {
                VNgineError("Impossible RegExp state (no matches!)",expr,false);
            }
            VNgineLog("ExprEval: starting loops to determine operands in " + expr);
            operand1 = evaluateExpression(match[1]);
            operand2 = evaluateExpression(match[3]);
            switch (match[2]) {
                case "&&": result = (operand1 == 1) && (operand2 == 1) ? 1 : 0; break;
                case "||": result = (operand1 == 1) || (operand2 == 1) ? 1 : 0; break;
                case "^^": result = (operand1 == 1 || operand2 == 1) && !(operand1 == 1 && operand2 == 1) ? 1 : 0; break;
            }
            expr = expr.replace(match[0],result);
        }
        while ((expr.indexOf("<") >= 0) || (expr.indexOf(">") >= 0) || (expr.indexOf("=") >= 0)) {
            var match = expr.match(/(-?[@\w]+?(?:\.\d+?)?)\s*?([<>=])\s*?(-?[@\w]+?(?:\.\d+?)?)\b/);
            if (match === null) {
                VNgineError("Impossible RegExp state (no matches!)",expr,false);
            }
            VNgineLog("ExprEval: starting loops to determine operands in " + expr);
            operand1 = evaluateExpression(match[1]);
            operand2 = evaluateExpression(match[3]);
            switch (match[2]) {
                case "<": result = operand1 < operand2 ? 1 : 0; break;
                case ">": result = operand1 > operand2 ? 1 : 0; break;
                case "=": result = operand1 == operand2 ? 1 : 0; break;
            }
            expr = expr.replace(match[0],result);
        }
        while ((expr.indexOf("^") >= 0) || (expr.indexOf("~") >= 0)) {
            var match = expr.match(/(-?[@\w]+?(?:\.\d+?)?)\s*?([\^~])\s*?(-?[@\w]+?(?:\.\d+?)?)\b/);
            if (match === null) {
                VNgineError("Impossible RegExp state (no matches!)",expr,false);
            }
            VNgineLog("ExprEval: starting loops to determine operands in " + expr);
            operand1 = evaluateExpression(match[1]);
            operand2 = evaluateExpression(match[3]);
            if (match[2] == "^") {
                result = Math.pow(operand1,operand2);
            } else {
                result = Math.pow(operand2,1/operand1);
            }
            expr = expr.replace(match[0],result);
        }
        while ((expr.indexOf("/") >= 0) || (expr.indexOf("*") >= 0)) {
            var match = expr.match(/(-?[@\w]+?(?:\.\d+?)?)\s*?([\/\*])\s*?(-?[@\w]+?(?:\.\d+?)?)\b/);
            if (match === null) {
                VNgineError("Impossible RegExp state (no matches!)",expr,false);
            }
            VNgineLog("ExprEval: starting loops to determine operands in " + expr);
            operand1 = evaluateExpression(match[1]);
            operand2 = evaluateExpression(match[3]);
            if (match[2] == "*") {
                result = operand1 * operand2;
            } else {
                result = operand1 / operand2;
            }
            expr = expr.replace(match[0],result);
        }
        while ((expr.indexOf("+") > 0) || (expr.slice(1).indexOf("-") >= 0)) {
            var match = expr.match(/(-?[@\w]+?(?:\.\d+?)?)\s*?([\+\-])\s*?(-?[@\w]+?(?:\.\d+?)?)\b/);
            if (match === null) {
                VNgineError("Impossible RegExp state (no matches!)",expr,false);
            }
            VNgineLog("ExprEval: starting loops to determine operands in " + expr);
            operand1 = evaluateExpression(match[1]);
            operand2 = evaluateExpression(match[3]);
            if (match[2] == "+") {
                result = operand1 + operand2;
            } else {
                result = operand1 - operand2;
            }
            expr = expr.replace(match[0],result);
            if (expr.slice(0,2) == "--") {
                expr = expr.slice(2);
            }
        }
        if (isNaN(expr)) {
            if (expr === undefined) {
                VNgineError("ExprEval: parser error (invalid input)","N/A",false);
                return 0;
            } else {
                if (expr[0] == "@") {
                    VNgineLog("ExprEval: sent down global variable value " + localStorage[expr] + ".");
                    return localStorage[expr];
                } else if (expr[0] == "\"") {
                    VNgineLog("ExprEval: sent down string " + expr + ".");
                    return expr;
                } else {
                    VNgineLog("ExprEval: sent down local variable value " + Variables[expr] + ".");
                    return Variables[expr];
                }
            }
        } else {
            VNgineLog("ExprEval: sent down value " + parseFloat(expr) + ".");
            return parseFloat(expr);
        }
    }
}

function nextline() {
    $('#messagenext').remove();
    $('#container').removeClass("clickable");
    var params = readLine().split(" ");
    var next = [params.splice(0,1)[0]];
    next.push(params.join(" "));
    VNgineLog("Parser: read event " + next[0] + " on line " + (NovelRunState - 1) + ".");
    
    switch (next[0]) {
        case 'dialog':
            $('#messagebox').html("<span></span>");
            TextSpeed = 30;
            CtrlSkipped = false;
            next[1] = next[1].replace(/\$@(.+?\b)/g,function(str, p1, offset, s){ return localStorage[p1]; });
            next[1] = next[1].replace(/\$(.+?\b)/g,function(str, p1, offset, s){ return Variables[p1]; });
            var StateMsg = next[1];
            if (next[1].charAt(0) == "[") {
                var end = next[1].indexOf("]");
                var side = next[1][end+1] == ">" ? "right" : "left";
                var other = (side == "right") ? "left" : "right";
                $('#messagename_container').removeClass("name_" + other).addClass("name_" + side);
                $('#messagename').show().html(next[1].slice(1,end));
                if (side == "right") { end++; }
                StateMsg = next[1].slice(end+2);
            } else {
                $('#messagename').html("").hide();
            }
            //StateTyperInterval = setInterval("typechar('messagebox')",30);
            var Typer = new characterTyper();
            Typer.Message = StateMsg;
            Typer.Element = $('#messagebox > span')[0];
            Typer.typeCharacter();
            break;
        case 'setchar':
            addCharacter(params[1],params[0]==1,true);
            VNgineLog("setchar: Created an image element for character file " + next[1]);
            break;
        case 'clrchar':
            if (params[0]==1) {
                $('.character').remove();
                initStep();
            } else {
                $('.character').fadeOut(1000,function() { $(this).remove(); });
                initStep(1000);
            }
            VNgineLog("clrchar: Destroying character layer(s)");
            break;
        case 'setbg':
            addBackground(params[1],params[0]==1);
            VNgineLog("setbg: Created an image element for background file " + next[1]);
            break;
        case 'choice':
            params = next[1].split(";");
            var len = params.length;
            $('#messagebox').html("").show();
            $('#messagename').html("").hide();
            for (var i = 0; i < len; i++) {
                $('#messagebox').append('<button class="choice" onclick="userChoice(' + i.toString() + ');">' + params[i] + '</button>');
                VNgineLog("choice: Created a button element for choice " + params[i] + ", value " + i.toString());
            }
            NovelAutoSave = saveCurrentState(false);
            break;
        case 'ifvar':
            if (Variables[params[0]] !== undefined) {
                if (Variables[params[0]] == params[1]) {
                    initStep();
                    VNgineLog("ifvar: initial comparison true; Variables[" + params[0] + "] = " + Variables[params[0]] + ", conditional value " + params[1]);
                } else {
                    VNgineLog("ifvar: initial comparison false, entering loop");
                    var level = 1;
                    var command = "";
                    while (level > 0) {
                        /*if (NovelScene.length == 0) {
                            VNgineError('premature end of scene (branch not closed correctly?)','N/A');
                            break;
                        }*/
                        line = readLine().split(" ");
                        command = line[0];
                        VNgineLog("ifvar: found command " + command + " at level " + level);
                        if (command == "ifvar") { level++; VNgineLog("ifvar: level raised to " + level); }
                        if (command == "endif") { level--; VNgineLog("ifvar: level lowered to " + level); }
                        if (level == 1) {
                            if (command == "elif") {
                                if (Variables[line[1]] !== undefined) {
                                    if (Variables[line[1]] == line[2]) { 
                                        VNgineLog("ifvar: comparison true; Variables[" + line[1] + "] = " + Variables[line[1]] + ", conditional value " + line[2]);
                                        VNgineLog("ifvar: exiting loop");
                                        level--;
                                    } else {
                                        VNgineLog("ifvar: comparison false; Variables[" + line[1] + "] = " + Variables[line[1]] + ", conditional value " + line[2]);
                                    }
                                } else {
                                    VNgineError('undefined variable name ' + params[0] + ' in ifvar event',next[1],false);
                                }
                            }
                            if (command == "else") { level--; VNgineLog("ifvar: exiting loop"); }
                        }
                    }
                    initStep();
                }
            } else {
                Variables[params[0]] = null;
                NovelRunState -= 1;
                VNgineError('undefined variable name ' + params[0] + ' in ifvar event',next[1],false);
            }
            break;
        case 'setvar':
            Variables[params[0]] = evaluateExpression(params.slice(1).join(" "));
            VNgineLog("setvar: Set the value of the local variable " + params[0] + " to " + Variables[params[0]]);
            initStep();
            break;
        case 'setglobal':
            localStorage[params[0]] = evaluateExpression(params.slice(1).join(" "));
            VNgineLog("setvar: Set the value of the global variable " + params[0] + " to " + Variables[params[0]]);
            initStep();
            break;
        case 'title':
            document.title = next[1] + " - VNgine";
            VNgineLog("title: Set the window title to " + next[1] + " - VNgine");
            initStep();
            break;
        case 'endif':
        case 'label':
        case '':
            initStep();
            break;
        case 'load':
            if (params[1] === undefined) {
                readScene(params[0],"start",false);
            } else {
                readScene(params[0],params[1],false);
            }
            break;
        case 'elif':
        case 'else':
            var level = 1;
            var command = "";
            VNgineLog(next[0] + ": entering loop to skip unrelated code branches");
            while (level > 0) {
                command = readLine().split(" ")[0];
                VNgineLog(next[0] + ": found command " + command + " on level " + level);
                if (command == "ifvar") { level++; VNgineLog(next[0] + ": level raised to " + level); }
                if (command == "endif") { level--; VNgineLog(next[0] + ": level lowered to " + level); }
            }
            initStep();
            break;
        case 'ending':
            $('#messagebox').html("").hide();
            $('#messagename').html("").hide();
            fadeColor("white",5000,true);
            stopMusic();
            var audio = $('audio.bgm#media_' + NovelAudio[next[1]])[0];
            audio.currentTime = 0;
            audio.play();
            audio.loop = false;
            $(audio).bind('ended', function(){
                this.loop = true;
                initStep();
            });
            break;
        case 'fade':
            fadeColor(params[1],params[2],params[0]==1);
            initStep(params[2]);
            break;
        case 'overlay':
            addOverlay(next[1]);
            VNgineLog("setbg: Created an image element for overlay file " + next[1]);
            break;
        case 'clroverlay':
            $('.overlay').fadeOut(parseInt(params[0]),function() { $(this).remove(); });
            initStep(params[0]);
            break;
        case 'playmus':
            stopMusic();
            var audio = $('audio.bgm#media_' + NovelAudio[next[1]])[0];
            audio.currentTime = 0;
            audio.play();
            initStep();
            break;
        case 'pause':
            VNgineLog("pause: waiting " + next[1] + " milliseconds");
            initStep(next[1]);
        case 'nop':
        case 'end':
            break;
        case 'jump':
            if (NovelLabels[next[1]] == undefined) {
                VNgineError('jump event points to a label "' + next[1] + '" that doesn\'t exist',next[1],true);
            } else {
                NovelRunState = NovelLabels[next[1]];
            }
            initStep();
            break;
        default:
            VNgineError('undefined event type "' + next[0] + '"',next[1],false);
    }
}

characterTyper = function() {
    this.Message = "";
    this.Parent = undefined;
    this.Element = undefined;
    this.Parameters = "";
}
characterTyper.prototype.typeCharacter = function() {
    var self = this;
    if (this.Message == "") {
        if (this.Parent == undefined) {
            addHistoryItem();
            if (CtrlSkipped) {
                initStep();
            } else {
                $('#messagebox').append('<button id="messagenext" onclick="nextline();">Next</button>');
                $('#container').addClass("clickable");
            }
        } else {
            setTimeout(function() { self.Parent.typeCharacter(); },TextSpeed);
        }
    } else {
        if (TextSpeed > 0) {
            var chr = this.Message.charAt(0);
            if (chr == "{") {
                // this branch will be entered when a modifier tag in the source line is encountered
                var tag = this.Message.match(/\{(.+?)(.*?)\}(.+?)\{\/\1}/);
                if (tag === null) {
                    var tag = this.Message.match(/\{(.+?)( .*?)? ?\/\}/);
                    if (tag === null) {
                        $(this.Element).append(chr);
                        this.Message = this.Message.slice(1);
                        setTimeout(function(){self.typeCharacter();},TextSpeed);
                    } else {
                        this.Message = this.Message.replace(tag[0],"");
                        switch(tag[1]) {
                            case "pause":
                                setTimeout(function() {self.typeCharacter(); },TextSpeed + parseInt(tag[2]));
                                break;
                            default:
                                this.Message = "[unknown tag " + tag[1] + "]" + this.Message;
                                VNgineLog("TextParser: encountered an undefined tag type " + tag[1]);
                                setTimeout(function() {self.typeCharacter(); },TextSpeed);
                            break;
                        }
                    }
                } else {
                    this.createSubParser(tag);
                }
            } else {
                $(this.Element).append(chr);
                this.Message = this.Message.slice(1);
                setTimeout(function(){self.typeCharacter();},TextSpeed);
            }
        } else {
            var chr = this.Message.charAt(0);
            while ((!(chr == "{")) && (this.Message.length > 0)) {
                $(this.Element).append(chr);
                this.Message = this.Message.slice(1);
                var chr = this.Message.charAt(0);
            }
            if (this.Message.length == 0) {
                setTimeout(function(){self.typeCharacter();},0);
            } else {
                var tag = this.Message.match(/\{(.+?)(.*?)\}(.+?)\{\/\1}/);
                if (tag === null) {
                    var tag = this.Message.match(/\{(.+?)( .*?)? ?\/\}/);
                    if (tag === null) {
                        $(this.Element).append(chr);
                        this.Message = this.Message.slice(1);
                        setTimeout(function(){self.typeCharacter();},0);
                    } else {
                        this.Message = this.Message.replace(tag[0],"");
                        switch(tag[1]) {
                            case "pause": break;
                            default:
                                this.Message = "[unknown tag " + tag[1] + "]" + this.Message;
                                VNgineLog("TextParser: encountered an undefined tag type " + tag[1]);
                            break;
                        }
                        setTimeout(function() {self.typeCharacter(); },0);
                    }
                } else {
                    this.createSubParser(tag);
                }
            }
        }
    }
}
characterTyper.prototype.createSubParser = function(tag) {
    var self = this;
    VNgineLog("TextParser: Creating a new subparser for tag " + tag[1] + tag[2] + " with inner text " + tag[3]);
    this.Message = this.Message.replace(tag[0],"");
    var tagtype = tag[1];
    var tagvars = tag[2];
    var modifier = "";
    switch (tagtype) {
        case "b": modifier = "font-weight: bold;"; break;
        case "i": modifier = "font-style: italic;"; break;
        case "u": modifier = "text-decoration: underline;"; break;
        case "s": modifier = "text-decoration: line-through;"; break;
        case "c": modifier = "color: "+tagvars+";"; break;
        case "fs": modifier = "font-size: "+tagvars+"pt;"; break;
        case "sc": modifier = "font-variant: small-caps"; break;
        case "sup": modifier = "font-size: .83em; vertical-align: super;"; break; 
        case "sub": modifier = "font-size: .83em; vertical-align: sub;"; break;
        case "lsp": modifier = "letter-spacing: "+tagvars+";"; break;
        case "hilite": modifier = "background-color: "+tagvars+";"; break;
        default: this.Message = "[unknown tag " + tagtype + "]" + this.Message;
            setTimeout(function() {self.typeCharacter(); },TextSpeed);
            VNgineLog("TextParser: encountered an undefined tag type " + tagtype);
            modifier = undefined;
    }
    if (modifier != undefined) {
        $(this.Element).append('<span style="' + modifier + '"></span>');
        var childTyper = new characterTyper();
        childTyper.Element = $(this.Element).children().last('span');
        childTyper.Parent = this;
        childTyper.Message = tag[3];
        setTimeout(function() {childTyper.typeCharacter(); },TextSpeed);
    }
}

function addBackground(path,instant) {
    $('#container').addClass("busy");
    var id = IDs.getBGID().toString();
    $('#container').append('<div class="background" id="bg_' + id + '"><img src="vn/' + NovelID +'/bg/' + path + '"></div>');
    if (instant) {
        $('#bg_' + id + ' > img').load(function() { $('#container').removeClass("busy"); $('.background:not(#bg_' + id + ')').remove(); initStep(); });
    } else {
        $('#bg_' + id + ' > img').hide().load(function() { $('#container').removeClass("busy"); $(this).fadeIn(1000,function(){ $('.background:not(#bg_' + id + ')').remove(); initStep(); })});
    }
}
function addOverlay(path,instant) {
    $('#container').addClass("busy");
    var id = IDs.getOverlayID().toString();
    $('#container').append('<div class="overlay" id="overlay_' + id + '"><img src="vn/' + NovelID +'/bg/' + path + '"></div>');
    $('#overlay_' + id + ' > img').hide().load(function() { $('#container').removeClass("busy"); $(this).fadeIn(1000,function(){ $('.overlay:not(#overlay_' + id + ')').remove(); initStep(); })});
}
function addCharacter(path,instant,clear_others) {
    $('#container').addClass("busy");
    var id = IDs.getCharID().toString();
    $('#container').append('<div class="character" id="char_' + id + '"><img src="vn/' + NovelID +'/char/' + path + '"></div>');
    if (instant) {
        $('#char_' + id + ' > img').hide().load(function() {
            $('#container').removeClass("busy");
            if (clear_others) {
                $('.character:not(#char_' + id + ')').remove();
            }
            $(this).show(); initStep();
        });
    } else {
        $('#char_' + id + ' > img').hide().load(function() {
            $('#container').removeClass("busy");
            $(this).fadeIn(1000,function() { initStep(500); });
            if (clear_others) {
                $('.character:not(#char_' + id + ')').delay(500).fadeOut(1000,function() {
                    $(this).remove();
                })
            };
        });
        
    }
}

function userChoice(option) {
    var msgbox = document.getElementById('messagebox');
    msgbox.innerHTML = "";
    Variables.choice = option;
    VNgineLog("choice: User selected option " + option.toString());
    initStep();
}

function fadeColor(color,duration,destroy) {
    color = typeof color !== 'undefined' ? color : "#ffffff";
    duration = typeof duration !== 'undefined' ? parseInt(duration) : 1000;
    destroy = typeof destroy !== 'undefined' ? destroy : false;
    var id = IDs.getOverlayID().toString();
    $('#container').append('<div class="overlay color-overlay" id="overlay_' + id + '" style="background-color: ' + color + '"></div>');
    $('#overlay_' + id).hide().fadeIn(duration,function() { if (destroy) { $('.character').remove(); $('.background').remove(); }});
}

function saveCurrentState(manual) {
    manual = typeof manual !== 'undefined' ? manual : true;
    savegame = {};
    savegame.NovelID = NovelID;
    savegame.NovelRunState = NovelRunState;
    savegame.NovelCurrentSceneFile = NovelCurrentSceneFile;
    savegame.NovelCurrentSceneHash = NovelCurrentSceneHash;
    savegame.Variables = Variables;
    savegame.Backgrounds = {};
    savegame.Characters = {};
    savegame.Overlays = {};
    savegame.Musics = {};
    savegame.BGMPlaying = -1;
    var j = 0; $('.background > img').each(function() { savegame.Backgrounds[j] = {URL: $(this).attr("src").replace("vn/"+NovelID+"/bg/","")}; j++; });
        j = 0; $('.character > img').each(function() { savegame.Characters[j] = {URL: $(this).attr("src").replace("vn/"+NovelID+"/char/","")}; j++; });
        j = 0; $('.overlay > img').each(function() { savegame.Overlays[j] = {URL: $(this).attr("src").replace("vn/"+NovelID+"/bg/",""), Type: "image"}; j++; });
               $('.overlay.color-overlay').each(function() { savegame.Overlays[j] = {Style: $(this).attr("style"), Type: "color"}; j++; });
        j = 0; $('.bgm').each(function() { savegame.Musics[j] = {URL: $(this).attr("src").replace("vn/"+NovelID+"/media/","")}; if(!(this.paused)) { savegame.BGMPlaying = $(this).attr("src").replace("vn/"+NovelID+"/media/",""); } j++; });
    //alert(JSON.stringify(savegame));
    //location.href = "data:application/octet-stream," + encodeURIComponent($.base64.encode(JSON.stringify(savegame)));
    if (manual) { $("#savedata")[0].value = $.base64.encode(JSON.stringify(savegame)); }
    else { return $.base64.encode(JSON.stringify(savegame)); }
}

function loadAutoSave() {
    if (($('#messagenext').length > 0) && ($('#container').hasClass("clickable"))) {
        if (NovelAutoSave != "") { loadSavedState(false,NovelAutoSave); }
    }
}
function loadSavedState(manual,savedata) {
    manual = typeof manual !== 'undefined' ? manual : true;
    if ((($('#messagenext').length > 0) && ($('#container').hasClass("clickable"))) || ($('.choice').length > 0)) {
        if (manual) { data = $("#loaddata")[0].value; }
        else { data = savedata; };
        OverrideStep = true;
        try {
            $("#loaddata")[0].value = ""; //$.base64.decode(data);
            savegame = JSON.parse($.base64.decode(data));
            $('#loadform').slideUp(1500);
            NovelID = savegame.NovelID;
            stopMusic();
            $('.character, .background, .overlay, .preloader').remove();
            IDs.reInitialize();
            NovelCurrentSceneFile = savegame.NovelCurrentSceneFile;
            readScene(NovelCurrentSceneFile,"start",true);
        } catch(err) {
            if (err == "SyntaxError: JSON.parse: unexpected end of data") {
                err = "The entered save data could not be read.";
            }
            VNgineError("Failed to parse the encoded save file: " + err,"",false);
        }
    }
}
function loadSavedStateFileRead() {
    if (NovelCurrentSceneHash != savegame.NovelCurrentSceneHash) {
        VNgineError("Scene hash doesn't match! (This probably means the novel files have been changed.)",savegame.NovelCurrentSceneHash + "==" + NovelCurrentSceneHash,false);
    }
    Variables = savegame.Variables;
    $.each(savegame.Backgrounds, function(ind,val) { $('#container').append('<div class="background" id="bg_' + IDs.getBGID() + '"><img src="vn/' + NovelID +'/bg/' + val.URL + '"></div>');});
    $.each(savegame.Characters, function(ind,val) { $('#container').append('<div class="character" id="char_' + IDs.getCharID() + '"><img src="vn/' + NovelID +'/char/' + val.URL + '"></div>');});
    $.each(savegame.Overlays, function(ind,val) { switch(val.Type) {
        case "image": $('#container').append('<div class="overlay" id="overlay_' + IDs.getOverlayID() + '"><img src="vn/' + NovelID +'/bg/' + val.URL + '"></div>'); break;
        case "color": var id = IDs.getOverlayID().toString(); $('#container').append('<div class="overlay color-overlay" id="overlay_' + id + '" style="' + val.Style + '"></div>'); break;
        }});
    if (savegame.BGMPlaying != -1) {
        bgmid = NovelAudio[savegame.BGMPlaying];
        if ($('audio.bgm#media_' + bgmid)[0] != undefined) {
            var audio = $('audio.bgm#media_' + bgmid)[0];
            audio.play();
        } else {
            addPreloadMusic(savegame.BGMPlaying);
        }
    }
    NovelRunState = savegame.NovelRunState - 1;
    savegame = {};
    OverrideStep = false;
    initStep();
}