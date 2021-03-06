/*
 * Copyright (c) 2018 University of Stuttgart.
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0, or the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0 OR Apache-2.0
 */

export const environment = {
  PRODUCTION: true,
  API_URL: 'http://localhost:1977',
  authorizeUrl: 'http://localhost:8081/oauth/authorize?',
  tokenUrl: 'http://localhost:8081/oauth/token',
  tokenRevokeUrl: 'http://localhost:8081/oauth/revoke_token',
  signinUrl: 'http://localhost:8081/user/create',
  userInfoUrl: 'http://localhost:8081/user_info',
  clientIdPrivate: 'pattern-pedia-private',
  clientSecret: '',
  clientIdPublic: 'pattern-pedia-public',
  clientIdPKCE: 'pattern-pedia-pkce',
  CONFIG_SERVER_URL:
    window['env'] && window['env']['CONFIG_SERVER_HOST_NAME'] &&
    window['env']['CONFIG_SERVER_PORT']
      ? `http://${window['env']['CONFIG_SERVER_HOST_NAME']}:${window['env']['CONFIG_SERVER_PORT']}/v2/keys`
      : 'http://localhost:2379/v2/keys'
};
