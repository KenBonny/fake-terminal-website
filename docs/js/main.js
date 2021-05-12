"use strict";

(async function () {
    /**
     * CONFIGS
     */
    const configResponse = await fetch('data/config.json');
    const config = await configResponse.json();

    const filesResponse = await fetch('data/files.json');
    const foo = await filesResponse.json();

    var files = (function () {
        var instance;
        class Singleton {
            constructor(options) {
                var options = options || Singleton.defaultOptions;
                for (var key in Singleton.defaultOptions) {
                    this[key] = options[key] || Singleton.defaultOptions[key];
                }
            }
        }
        Singleton.defaultOptions = {
            "about.txt": "This website was made using only pure JavaScript with no extra libraries.\nI made it dynamic so anyone can use it, just download it from GitHub and change the config text according to your needs.\nIf you manage to find any bugs or security issues feel free to email me: luisbraganca@protonmail.com",
            "getting_started.txt": "First, go to js/main.js and replace all the text on both singleton vars.\n- configs: All the text used on the website.\n- files: All the fake files used on the website. These files are also used to be listed on the sidenav.\nAlso please notice if a file content is a raw URL, when clicked/concatenated it will be opened on a new tab.\nDon't forget also to:\n- Change the page title on the index.html file\n- Change the website color on the css/main.css\n- Change the images located at the img folder. The suggested sizes are 150x150 for the avatar and 32x32/16x16 for the favicon.",
            "contact.txt": "mail@example.com",
            "social_network_1.txt": "https://www.socialite.com/username/",
            "social_network_2.txt": "https://example.com/profile/9382/"
        };
        return {
            getInstance: function (options) {
                instance === void 0 && (instance = new Singleton(options));
                return instance;
            }
        };
    })();

    /**
     * AUX FUNCTIONS
     */

    var isUsingIE = (function () {
        return function () {
            var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            return (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./));
        }
    })();

    var ignoreEvent = (function () {
        return function (event) {
            event.preventDefault();
            event.stopPropagation();
        };
    })();

    var scrollToBottom = (function () {
        return function () {
            window.scrollTo(0, document.body.scrollHeight);
        }
    })();

    var isPhone = navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);


    /**
     * MODEL
     */

    var InvalidArgumentException = function (message) {
        this.message = message;
        // Use V8's native method if available, otherwise fallback
        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(this, InvalidArgumentException);
        } else {
            this.stack = (new Error()).stack;
        }
    };
    // Extends Error
    InvalidArgumentException.prototype = Object.create(Error.prototype);
    InvalidArgumentException.prototype.name = "InvalidArgumentException";
    InvalidArgumentException.prototype.constructor = InvalidArgumentException;

    var cmds = {
        LS: { value: "ls", help: config.ls_help},
        CAT: { value: "cat", help: config.cat_help },
        WHOAMI: { value: "whoami", help: config.whoami_help },
        DATE: { value: "date", help: config.date_help },
        HELP: { value: "help", help: config.help_help },
        CLEAR: { value: "clear", help: config.clear_help },
        REBOOT: { value: "reboot", help: config.reboot_help },
        CD: { value: "cd", help: config.cd_help },
        MV: { value: "mv", help: config.mv_help },
        RM: { value: "rm", help: config.rm_help },
        RMDIR: { value: "rmdir", help: config.rmdir_help },
        TOUCH: { value: "touch", help: config.touch_help },
        SUDO: { value: "sudo", help: config.sudo_help }
    };


    class Terminal {
        constructor(prompt, cmdLine, output, sidenav, profilePic, user, host, root, outputTimer) {
            if (!(prompt instanceof Node) || prompt.nodeName.toUpperCase() !== "DIV") {
                throw new InvalidArgumentException("Invalid value " + prompt + " for argument 'prompt'.");
            }
            if (!(cmdLine instanceof Node) || cmdLine.nodeName.toUpperCase() !== "INPUT") {
                throw new InvalidArgumentException("Invalid value " + cmdLine + " for argument 'cmdLine'.");
            }
            if (!(output instanceof Node) || output.nodeName.toUpperCase() !== "DIV") {
                throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
            }
            if (!(sidenav instanceof Node) || sidenav.nodeName.toUpperCase() !== "DIV") {
                throw new InvalidArgumentException("Invalid value " + sidenav + " for argument 'sidenav'.");
            }
            if (!(profilePic instanceof Node) || profilePic.nodeName.toUpperCase() !== "IMG") {
                throw new InvalidArgumentException("Invalid value " + profilePic + " for argument 'profilePic'.");
            }
            (typeof user === "string" && typeof host === "string") && (this.completePrompt = user + "@" + host + ":~" + (root ? "#" : "$"));
            this.profilePic = profilePic;
            this.prompt = prompt;
            this.cmdLine = cmdLine;
            this.output = output;
            this.sidenav = sidenav;
            this.sidenavOpen = false;
            this.sidenavElements = [];
            this.typeSimulator = new TypeSimulator(outputTimer, output);
        }
        type(text, callback) {
            this.typeSimulator.type(text, callback);
        }
        exec() {
            var command = this.cmdLine.value;
            this.cmdLine.value = "";
            this.prompt.textContent = "";
            this.output.innerHTML += "<span class=\"prompt-color\">" + this.completePrompt + "</span> " + command + "<br/>";
        }
        init() {
            this.sidenav.addEventListener("click", ignoreEvent);
            this.cmdLine.disabled = true;
            this.sidenavElements.forEach(function (elem) {
                elem.disabled = true;
            });
            this.prepareSideNav();
            this.lock(); // Need to lock here since the sidenav elements were just added
            document.body.addEventListener("click", this.focus.bind(this));
            this.cmdLine.addEventListener("keydown", function (event) {
                if (event.which === 13 || event.keyCode === 13) {
                    this.handleCmd();
                    ignoreEvent(event);
                }
                else if (event.which === 9 || event.keyCode === 9) {
                    this.handleFill();
                    ignoreEvent(event);
                }
            }.bind(this));
            this.reset();
        }
        prepareSideNav() {
            var capFirst = (function () {
                return function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                };
            })();
            for (var file in files.getInstance()) {
                console.log(file);
                var element = document.createElement("button");
                Terminal.makeElementDisappear(element);
                element.onclick = function (file, event) {
                    this.handleSidenav(event);
                    this.cmdLine.value = "cat " + file + " ";
                    this.handleCmd();
                }.bind(this, file);
                element.appendChild(document.createTextNode(capFirst(file.replace(/\.[^/.]+$/, "").replace(/_/g, " "))));
                this.sidenav.appendChild(element);
                this.sidenavElements.push(element);
            }
            // Shouldn't use document.getElementById but Terminal is already using loads of params
            document.getElementById("sidenavBtn").addEventListener("click", this.handleSidenav.bind(this));
        }
        handleSidenav(event) {
            if (this.sidenavOpen) {
                this.profilePic.style.opacity = 0;
                this.sidenavElements.forEach(Terminal.makeElementDisappear);
                this.sidenav.style.width = "50px";
                document.getElementById("sidenavBtn").innerHTML = "&#9776;";
                this.sidenavOpen = false;
            }
            else {
                this.sidenav.style.width = "300px";
                this.sidenavElements.forEach(Terminal.makeElementAppear);
                document.getElementById("sidenavBtn").innerHTML = "&times;";
                this.profilePic.style.opacity = 1;
                this.sidenavOpen = true;
            }
            document.getElementById("sidenavBtn").blur();
            ignoreEvent(event);
        }
        lock() {
            this.exec();
            this.cmdLine.blur();
            this.cmdLine.disabled = true;
            this.sidenavElements.forEach(function (elem) {
                elem.disabled = true;
            });
        }
        unlock() {
            this.cmdLine.disabled = false;
            this.prompt.textContent = this.completePrompt;
            this.sidenavElements.forEach(function (elem) {
                elem.disabled = false;
            });
            scrollToBottom();
            if (!isPhone) {
                this.focus();
            }
        }
        handleFill() {
            var cmdComponents = this.cmdLine.value.trim().split(" ");
            if ((cmdComponents.length <= 1) || (cmdComponents.length === 2 && cmdComponents[0] === cmds.CAT.value)) {
                this.lock();
                var possibilities = [];
                if (cmdComponents[0].toLowerCase() === cmds.CAT.value) {
                    if (cmdComponents.length === 1) {
                        cmdComponents[1] = "";
                    }
                    if (config.welcome_file_name.startsWith(cmdComponents[1].toLowerCase())) {
                        possibilities.push(cmds.CAT.value + " " + config.welcome_file_name);
                    }
                    for (var file in files.getInstance()) {
                        if (file.startsWith(cmdComponents[1].toLowerCase())) {
                            possibilities.push(cmds.CAT.value + " " + file);
                        }
                    }
                }
                else {
                    for (var command in cmds) {
                        if (cmds[command].value.startsWith(cmdComponents[0].toLowerCase())) {
                            possibilities.push(cmds[command].value);
                        }
                    }
                }
                if (possibilities.length === 1) {
                    this.cmdLine.value = possibilities[0] + " ";
                    this.unlock();
                }
                else if (possibilities.length > 1) {
                    this.type(possibilities.join("\n"), function () {
                        this.cmdLine.value = cmdComponents.join(" ");
                        this.unlock();
                    }.bind(this));
                }
                else {
                    this.cmdLine.value = cmdComponents.join(" ");
                    this.unlock();
                }
            }
        }
        handleCmd() {
            var cmdComponents = this.cmdLine.value.trim().split(" ");
            this.lock();
            switch (cmdComponents[0]) {
                case cmds.CAT.value:
                    this.cat(cmdComponents);
                    break;
                case cmds.LS.value:
                    this.ls();
                    break;
                case cmds.WHOAMI.value:
                    this.whoami();
                    break;
                case cmds.DATE.value:
                    this.date();
                    break;
                case cmds.HELP.value:
                    this.help();
                    break;
                case cmds.CLEAR.value:
                    this.clear();
                    break;
                case cmds.REBOOT.value:
                    this.reboot();
                    break;
                case cmds.CD.value:
                case cmds.MV.value:
                case cmds.RMDIR.value:
                case cmds.RM.value:
                case cmds.TOUCH.value:
                    this.permissionDenied(cmdComponents);
                    break;
                case cmds.SUDO.value:
                    this.sudo();
                    break;
                default:
                    this.invalidCommand(cmdComponents);
                    break;
            };
        }
        cat(cmdComponents) {
            var result;
            if (cmdComponents.length <= 1) {
                result = config.usage + ": " + cmds.CAT.value + " <" + config.file + ">";
            }
            else if (!cmdComponents[1] || (!cmdComponents[1] === config.welcome_file_name && !files.getInstance().hasOwnProperty(cmdComponents[1]))) {
                result = config.file_not_found.replace(config.value_token, cmdComponents[1]);
            }
            else {
                result = cmdComponents[1] === config.welcome_file_name ? config.welcome : files.getInstance()[cmdComponents[1]];
            }
            this.type(result, this.unlock.bind(this));
        }
        ls() {
            var result = ".\n..\n" + config.welcome_file_name + "\n";
            for (var file in files.getInstance()) {
                result += file + "\n";
            }
            this.type(result.trim(), this.unlock.bind(this));
        }
        sudo() {
            this.type(config.sudo_message, this.unlock.bind(this));
        }
        whoami(cmdComponents) {
            var result = config.username + ": " + config.user + "\n" + config.hostname + ": " + config.host + "\n" + config.platform + ": " + navigator.platform + "\n" + config.accesible_cores + ": " + navigator.hardwareConcurrency + "\n" + config.language + ": " + navigator.language;
            this.type(result, this.unlock.bind(this));
        }
        date(cmdComponents) {
            this.type(new Date().toString(), this.unlock.bind(this));
        }
        help() {
            var result = config.general_help + "\n\n";
            for (var cmd in cmds) {
                result += cmds[cmd].value + " - " + cmds[cmd].help + "\n";
            }
            this.type(result.trim(), this.unlock.bind(this));
        }
        clear() {
            this.output.textContent = "";
            this.prompt.textContent = "";
            this.prompt.textContent = this.completePrompt;
            this.unlock();
        }
        reboot() {
            this.type(config.reboot_message, this.reset.bind(this));
        }
        reset() {
            this.output.textContent = "";
            this.prompt.textContent = "";
            if (this.typeSimulator) {
                this.type(config.welcome + (isUsingIE() ? "\n" + config.internet_explorer_warning : ""), function () {
                    this.unlock();
                }.bind(this));
            }
        }
        permissionDenied(cmdComponents) {
            this.type(config.permission_denied_message.replace(config.value_token, cmdComponents[0]), this.unlock.bind(this));
        }
        invalidCommand(cmdComponents) {
            this.type(config.invalid_command_message.replace(config.value_token, cmdComponents[0]), this.unlock.bind(this));
        }
        focus() {
            this.cmdLine.focus();
        }
        static makeElementDisappear(element) {
            element.style.opacity = 0;
            element.style.transform = "translateX(-300px)";
            // Support for old browsers
            element.style.msTransform = "translateX(-300px)";
            element.style.WebkitTransform = "translateX(-300px)";
        }
        static makeElementAppear(element) {
            element.style.opacity = 1;
            element.style.transform = "translateX(0)";
            // Support for old browsers
            element.style.msTransform = "translateX(0)";
            element.style.WebkitTransform = "translateX(0)";
        }
    }

    class TypeSimulator {
        constructor(timer, output) {
            var timer = parseInt(timer);
            if (timer === Number.NaN || timer < 0) {
                throw new InvalidArgumentException("Invalid value " + timer + " for argument 'timer'.");
            }
            if (!(output instanceof Node)) {
                throw new InvalidArgumentException("Invalid value " + output + " for argument 'output'.");
            }
            this.timer = timer;
            this.output = output;
        }
        type(text, callback) {
            var isURL = (function () {
                return function (str) {
                    return (str.startsWith("http") || str.startsWith("www")) && str.indexOf(" ") === -1 && str.indexOf("\n") === -1;
                };
            })();
            if (isURL(text)) {
                window.open(text);
            }
            var i = 0;
            var output = this.output;
            var timer = this.timer;
            var skipped = false;
            var skip = function () {
                skipped = true;
            }.bind(this);
            document.addEventListener("dblclick", skip);
            (function typer() {
                if (i < text.length) {
                    var char = text.charAt(i);
                    var isNewLine = char === "\n";
                    output.innerHTML += isNewLine ? "<br/>" : char;
                    i++;
                    if (!skipped) {
                        setTimeout(typer, isNewLine ? timer * 2 : timer);
                    }
                    else {
                        output.innerHTML += (text.substring(i).replace(new RegExp("\n", 'g'), "<br/>")) + "<br/>";
                        document.removeEventListener("dblclick", skip);
                        callback();
                    }
                }
                else if (callback) {
                    output.innerHTML += "<br/>";
                    document.removeEventListener("dblclick", skip);
                    callback();
                }
                scrollToBottom();
            })();
        }
    }


    return {
        listener: function () {
            new Terminal(
                document.getElementById("prompt"),
                document.getElementById("cmdline"),
                document.getElementById("output"),
                document.getElementById("sidenav"),
                document.getElementById("profilePic"),
                config.user,
                config.host,
                config.is_root,
                config.type_delay
            ).init();
        }
    };
})()
    .then(main => window.onload = main.listener)
    .catch(err => console.error(err));