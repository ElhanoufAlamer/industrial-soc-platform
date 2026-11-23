/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { useState } from 'react';
import {
  EuiText,
  EuiCompressedFieldText,
  EuiCompressedFieldPassword,
  EuiSpacer,
  EuiButton,
  EuiImage,
  EuiListGroup,
  EuiForm,
  EuiCompressedFormRow,
  EuiHorizontalRule,
} from '@elastic/eui';
import { CoreStart } from '../../../../../src/core/public';
import { ClientConfigType } from '../../types';
import defaultBrandImage from '../../assets/ui/wazuh_logo.svg';
import { validateCurrentPassword } from '../../utils/login-utils';
import {
  ANONYMOUS_AUTH_LOGIN,
  AuthType,
  OPENID_AUTH_LOGIN_WITH_FRAGMENT,
  SAML_AUTH_LOGIN_WITH_FRAGMENT,
} from '../../../common';
import { getSavedTenant } from '../../utils/storage-utils';

interface LoginPageDeps {
  http: CoreStart['http'];
  chrome: CoreStart['chrome'];
  config: ClientConfigType;
}

interface LoginButtonConfig {
  buttonname: string;
  showbrandimage: boolean;
  brandimage: string;
  buttonstyle: string;
}

export function getNextPath(serverBasePath: string) {
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    // Appending the next url with trailing slash. We do so because in case the serverBasePath is empty, we can simply
    // redirect to '/'.
    nextUrl = serverBasePath + '/';
  }
  const savedTenant = getSavedTenant();
  const url = new URL(
    window.location.protocol + '//' + window.location.host + nextUrl + window.location.hash
  );
  if (
    !!savedTenant &&
    !(
      url.searchParams.has('security_tenant') ||
      url.searchParams.has('securitytenant') ||
      url.searchParams.has('securityTenant_')
    )
  ) {
    url.searchParams.append('security_tenant', savedTenant);
  }
  return url.pathname + url.search + url.hash;
}

function redirect(serverBasePath: string) {
  // navigate to nextUrl
  window.location.href = getNextPath(serverBasePath);
}

export function extractNextUrlFromWindowLocation(): string {
  const urlParams = new URLSearchParams(window.location.search);
  let nextUrl = urlParams.get('nextUrl');
  if (!nextUrl || nextUrl.toLowerCase().includes('//')) {
    return '';
  } else {
    nextUrl = encodeURIComponent(nextUrl);
    const hash = window.location.hash || '';
    nextUrl += hash;
  }
  return `?nextUrl=${nextUrl}`;
}

export function LoginPage(props: LoginPageDeps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginFailed, setloginFailed] = useState(false);
  const [loginError, setloginError] = useState('');
  const [usernameValidationFailed, setUsernameValidationFailed] = useState(false);
  const [passwordValidationFailed, setPasswordValidationFailed] = useState(false);

  let errorLabel: any = null;
  if (loginFailed) {
    errorLabel = (
      <EuiText id="error" color="danger" textAlign="center">
        <b>{loginError}</b>
      </EuiText>
    );
  }

  // @ts-ignore : Parameter 'e' implicitly has an 'any' type.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear errors
    setloginFailed(false);
    setUsernameValidationFailed(false);
    setPasswordValidationFailed(false);

    // Form validation
    if (username === '') {
      setUsernameValidationFailed(true);
      return;
    }

    if (password === '') {
      setPasswordValidationFailed(true);
      return;
    }

    try {
      await validateCurrentPassword(props.http, username, password);
      redirect(props.http.basePath.serverBasePath);
    } catch (error) {
      console.log(error);
      setloginFailed(true);
      setloginError('Invalid username or password. Please try again.');
      return;
    }
  };

  const renderLoginButton = (
    authType: string,
    loginEndPoint: string,
    buttonConfig: LoginButtonConfig
  ) => {
    const buttonId = `${authType}_login_button`;
    const loginEndPointWithPath = `${props.http.basePath.serverBasePath}${loginEndPoint}`;
    return (
      <EuiCompressedFormRow>
        <EuiButton
          data-test-subj="submit"
          aria-label={buttonId}
          size="s"
          type="prime"
          className={buttonConfig.buttonstyle || 'btn-login'}
          href={loginEndPointWithPath}
          iconType={buttonConfig.showbrandimage ? buttonConfig.brandimage : ''}
        >
          {buttonConfig.buttonname}
        </EuiButton>
      </EuiCompressedFormRow>
    );
  };

  const formOptions = (options: string | string[]) => {
    let formBody = [];
    const formBodyOp = [];
    let authOpts: string[] = [];

    // Convert auth options to a usable array
    if (typeof options === 'string') {
      if (options !== '') {
        authOpts.push(options.toLowerCase());
      }
    } else if (!(options && options.length === 1 && options[0] === '')) {
      authOpts = [...options];
    }
    if (authOpts.length === 0) {
      authOpts.push(AuthType.BASIC);
    }

    // Remove proxy and jwt from the list because they do not have a login button
    // The count of visible options determines if a separator gets added
    authOpts = authOpts.filter((auth) => auth !== AuthType.PROXY && auth !== AuthType.JWT);

    for (let i = 0; i < authOpts.length; i++) {
      switch (authOpts[i].toLowerCase()) {
        case AuthType.BASIC: {
          formBody.push(
            <EuiCompressedFormRow>
              <EuiCompressedFieldText
                data-test-subj="user-name"
                aria-label="username_input"
                placeholder="Username"
                icon="user"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                isInvalid={usernameValidationFailed}
              />
            </EuiCompressedFormRow>
          );
          formBody.push(
            <EuiCompressedFormRow isInvalid={passwordValidationFailed}>
              <EuiCompressedFieldPassword
                data-test-subj="password"
                aria-label="password_input"
                placeholder="Password"
                type="dual"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                isInvalid={passwordValidationFailed}
              />
            </EuiCompressedFormRow>
          );
          const buttonId = `${AuthType.BASIC}_login_button`;
          formBody.push(
            <EuiCompressedFormRow>
              <EuiButton
                data-test-subj="submit"
                aria-label={buttonId}
                fill
                size="s"
                type="submit"
                className={props.config.ui.basicauth.login.buttonstyle || 'btn-login'}
                onClick={handleSubmit}
              >
                Log in
              </EuiButton>
            </EuiCompressedFormRow>
          );

          if (props.config.auth.anonymous_auth_enabled) {
            const anonymousConfig = props.config.ui[AuthType.ANONYMOUS].login;
            formBody.push(
              renderLoginButton(AuthType.ANONYMOUS, ANONYMOUS_AUTH_LOGIN, anonymousConfig)
            );
          }

          if (authOpts.length > 1) {
            // Add a separator between the username/password form and the other login options
            formBody.push(<EuiSpacer size="xs" />);
            formBody.push(<EuiHorizontalRule size="full" margin="xl" />);
            formBody.push(<EuiSpacer size="xs" />);
          }
          break;
        }
        case AuthType.OPEN_ID: {
          const oidcConfig = props.config.ui[AuthType.OPEN_ID].login;
          const nextUrl = extractNextUrlFromWindowLocation();
          const oidcAuthLoginUrl = OPENID_AUTH_LOGIN_WITH_FRAGMENT + nextUrl;
          formBodyOp.push(renderLoginButton(AuthType.OPEN_ID, oidcAuthLoginUrl, oidcConfig));
          break;
        }
        case AuthType.SAML: {
          const samlConfig = props.config.ui[AuthType.SAML].login;
          const nextUrl = extractNextUrlFromWindowLocation();
          const samlAuthLoginUrl = SAML_AUTH_LOGIN_WITH_FRAGMENT + nextUrl;
          formBodyOp.push(renderLoginButton(AuthType.SAML, samlAuthLoginUrl, samlConfig));
          break;
        }
        default: {
          setloginFailed(true);
          setloginError(
            `Authentication Type: ${authOpts[i]} is not supported for multiple authentication.`
          );
          break;
        }
      }
    }

    formBody = formBody.concat(formBodyOp);
    return formBody;
  };

  return (
    <EuiListGroup className="login-wrapper">
      <div className="login-screen">
        <section className="login-brand-panel">
          <div className="login-brand-header">
            {props.config.ui.basicauth.login.showbrandimage && (
              <EuiImage
                className="login-brand-logo"
                size="fullWidth"
                alt="Wazuh"
                url={props.config.ui.basicauth.login.brandimage || defaultBrandImage}
              />
            )}
            <span className="login-version">INDUSTRIAL SECURITY</span>
          </div>

          <div className="login-brand-content">
            <EuiText size="xs" className="login-eyebrow">
              INDUSTRIAL SECURITY OPERATIONS
            </EuiText>

            <h1 className="login-headline">
              {props.config.ui.basicauth.login.title || 'Clarity across your control environment.'}
            </h1>

            <p className="login-description">
              {props.config.ui.basicauth.login.subtitle ||
                'One workspace to investigate threats, understand your assets, and protect industrial operations.'}
            </p>

            <ul className="login-features">
              <li>Continuous visibility</li>
              <li>ICS threat intelligence</li>
              <li>Accountable operations</li>
            </ul>
          </div>

          <div className="login-brand-footer">
            <span>INDUSTRIAL SECURITY OPERATIONS</span>
            <span>Security information &amp; event management</span>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-content">
            <div className="login-welcome">
              <EuiText size="xs" className="login-eyebrow">
                YOUR OPERATIONS WORKSPACE
              </EuiText>
              <h2>Welcome back</h2>
              <p>Sign in to your industrial security console.</p>
            </div>

            <EuiForm component="form" className="login-form">
              {formOptions(props.config.auth.type)}
              {errorLabel}
            </EuiForm>

            <div className="login-security-note">
              <span>◇</span>
              <p>Access is monitored. Authorized personnel only.</p>
            </div>

            <div className="login-form-footer">Industrial Security Operations</div>
          </div>
        </section>
      </div>
    </EuiListGroup>
  );
}
