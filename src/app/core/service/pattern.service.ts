/*
 * Copyright (c) 2019 University of Stuttgart.
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

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {globals} from '../../globals';
import {Observable} from 'rxjs';
import Pattern from '../model/hal/pattern.model';
import {map} from 'rxjs/operators';
import {PatternResponse} from '../model/hal/pattern-response.interface';
import PatternLanguage from '../model/hal/pattern-language.model';

@Injectable()
export class PatternService {

    private repoEndpoint = globals.repoEndpoint;

    constructor(private http: HttpClient) {
    }

    public getPatternByEncodedUri(encodedUri: string): Observable<Pattern> {
        const url = this.repoEndpoint + '/patterns/search/findByUri?encodedUri=' + encodedUri;
        return this.http.get<Pattern>(url);
    }

    getPatternsByUrl(patternsUrl: string): Observable<Array<Pattern>> {
        return this.http.get<PatternResponse>(patternsUrl).pipe(
            map(result => {
                return <Array<Pattern>>(result._embedded ? result._embedded.patternModels : []);
            })
        );
    }

    getPatternContentByPattern(pattern: Pattern): Observable<{ content: any }> {
        return this.http.get<{ content: any }>(pattern._links.content.href);
    }

    savePattern(url: string, pattern: any): Observable<any> {
        return this.http.post<Pattern>(url, pattern, {observe: 'response'});
    }

    updatePattern(url: string, pattern: any): Observable<any> {
        return this.http.put<Pattern>(url, pattern, {observe: 'response'});
    }


    getPatternById(patternLanguage: PatternLanguage, patternId: String): Observable<Pattern> {
        console.log('patternid');
        console.log(patternId);
        return this.http.get <Pattern>(this.repoEndpoint + '/patternLanguages/' + patternLanguage.id + '/patterns/' + patternId);
    }
}
