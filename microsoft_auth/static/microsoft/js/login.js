/* jshint esnext: true */
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;domain=" +
  window.location.hostname;
}

(function () {
    'use strict';

    class LoginController {
        constructor(options) {
            this._loginURL = options.authorization_url;
            this._subdomain = options.subdomain
            this._loginWindow = null;

            // init event handlers
            document.getElementById('password-login').addEventListener('click', this.showLoginForm.bind(this));
            document.getElementById('microsoft-login').addEventListener('click', this.showMicrosoftLogin.bind(this));
            window.addEventListener('message', this.receiveMessage.bind(this));

            // automatically show password login if Django gives error message
            if (document.querySelector('.errornote')) {
                this.showLoginForm({
                    target: document.getElementById('password-login')
                });
            }
        }

        // event handler for showing username/password login form
        showLoginForm(event) {
            // close Microsoft login window if it exists
            var microsoftLoginButton = document.getElementById('microsoft-login');

            if (microsoftLoginButton.classList.contains('active')) {
                if (this._loginWindow !== null) {
                    this._loginWindow.close();
                    this._loginWindow = null;
                }

                microsoftLoginButton.classList.remove('active');
            }

            // only open if not already open
            if (!event.target.classList.contains('active')) {
                let loginForm = document.getElementById('login-container')

                event.target.classList.add('active');

                if (loginForm.classList.contains('hide')) {
                    loginForm.classList.remove('hide');
                }
            }
        }

        // event handler to init Microsoft OAuth login window
        showMicrosoftLogin(event) {
            // remove any existing errors first
            var error = document.querySelector('.errornote');

            if (error !== null) {
                error.parentNode.removeChild(error);
            }

            // close username/password login form if it is open
            var loginFormButton = document.getElementById('password-login');

            if (loginFormButton.classList.contains('active')) {
                let loginForm = document.getElementById('login-container');
                let passwordLoginButton = document.getElementById('password-login');

                loginForm.classList.add('hide');

                if (passwordLoginButton.classList.contains('active')) {
                    passwordLoginButton.classList.remove('active');
                }
            }

            // close existing window if it exists
            if (this._loginWindow !== null) {
                this._loginWindow.close();
                this._loginWindow = null;
            }

            // open new login window
            this._loginWindow = window.open(
                this._loginURL,
                'microsoft-login',
                'height=560, width=790, left=550, top=200, menubar=no, location=no, resizable=no, scrollbars=yes, status=no, toolbar=no'
            );
        }

        // event handler to handle messages from child Microsoft login window
        receiveMessage(event) {
            if (event.origin === undefined) {
                event = event.originalEvent;
            }

            // verify the message is from us, handling the subdomain manually here
            let event_origin = event.origin
            if (this._subdomain) {
                event_origin = event.data.origin_with_subdomain;
            }

            let origin = window.location.protocol + '//' + window.location.host;

            if (event_origin === origin) {
                if (event.data.microsoft_auth) {
                    let data = event.data.microsoft_auth;
                    if (data.error) {
                        console.warn(data);

                        // add error message to screen
                        var loginContainer = document.getElementById('content-main');
                        var error = document.createElement('p');

                        error.innerText = data.error_description;
                        error.className = 'errornote';

                        loginContainer.insertBefore(error,
                            loginContainer.firstChild);
                    } else {
                        // redirect to next URL if it was provided
                        let new_path = this.parseGETParam('next') || '/admin';
                        if (event.data.sessionid) {
                            setCookie("sessionid", event.data.sessionid, 1);
                        }
                        window.location = origin + new_path;
                    }
                }
            }
        }

        // parses GET parameter from URL
        parseGETParam(val) {
            let result = false;
            let tmp = [];
            let items = location.search.substr(1).split('&');

            for (let index = 0; index < items.length; index++) {
                tmp = items[index].split('=');

                if (tmp[0] === val) {
                    result = decodeURIComponent(tmp[1]);
                }
            }
            return result;
        }
    }

    window.microsoft = window.microsoft || {};
    window.microsoft.objects = window.microsoft.objects || {};
    window.microsoft.objects.LoginController = LoginController;
})();
