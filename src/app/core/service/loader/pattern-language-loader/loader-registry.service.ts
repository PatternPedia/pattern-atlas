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

import { Injectable } from '@angular/core';
import Loader from '../../../model/loader';

@Injectable({
    providedIn: 'root'
})
export class LoaderRegistryService {

    private dictionary = new Map<string, Loader<any>>();

    constructor() {
    }

    getContentLoader<T>(contentIRI): Loader<T> {
        console.log(this.dictionary.entries());
        return this.dictionary.get(contentIRI);
    }

    registerContentLoader(loader: Loader<any>): void {
        this.dictionary.set(loader.supportedIRI, loader);
    }

    removeContentLoader(loader: Loader<any>): void {
        this.dictionary.delete(loader.supportedIRI);
    }
}