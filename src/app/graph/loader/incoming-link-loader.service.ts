import { Injectable } from '@angular/core';
import { Relation } from '../model';
import { PatternOntologyService } from 'src/app/core/service/pattern-ontology.service';
import Loader from 'src/app/core/model/loader';
import { IriConverter } from 'src/app/core/util/iri-converter';

@Injectable({
  providedIn: 'root'
})
/**
 * Loads all incoming links of a given pattern uri within its same language.
 * Incoming links are directed relations that specify the given pattern as target.
 */
export class IncomingLinkLoaderService extends Loader<Relation> {

  constructor(private pos: PatternOntologyService) {
    super(null, pos);
  }

  async loadContentFromStore(uri?: string): Promise<Map<string, any>> {
    return this.selectContentFromStore(uri)
            .then(
                triples => this.mapTriples(triples, uri)
            );
  }

  getGraphs(): Promise<Array<string>> {
    if (!this.supportedIRI) {
      throw new Error('supportedIRI has not been initialized! Make sure to set the language URI before loading');
    }

    const uri = IriConverter.getFileName(this.supportedIRI);

    // we cut the patternlanguage of the set supportedIRI to create the uris of the patterns and relations file
    const index = uri.lastIndexOf('/') + 1;

    const base = uri;
    const p = `${uri}/${uri.substr(index)}-Patterns`;
    const r = `${uri}/${uri.substr(index)}-Relations`;

    return Promise.resolve(['https://purl.org/patternpedia', base, p, r]);
  }

  async selectContentFromStore(uri?: string): Promise<any> {
    // we need a specific pattern of form 'pattern#Pattern'
    if (!uri) {
      return Promise.resolve();
    }

    const graphs = await this.getGraphs();

    // we need the uri of the referenced pattern in order to retrieve the pattern name
    const uriQry = `SELECT ?sourceUri
      WHERE {
        ?targetLink a <https://purl.org/patternpedia#DirectedPatternRelationDescriptor> ;
              <https://purl.org/patternpedia#hasTarget> <${uri}> ;
              <https://purl.org/patternpedia#hasSource> ?sourceUri .
      }`;
    const patterns = await this.executor.exec(uriQry, graphs);

    // get all information about the given pattern uri
    const qry = `SELECT ?sourceUri ?sourceName ?linkUri ?description
      WHERE {
        ?linkUri a <https://purl.org/patternpedia#DirectedPatternRelationDescriptor> ;
              <https://purl.org/patternpedia#hasTarget> <${uri}> ;
              <https://purl.org/patternpedia#hasSource> ?sourceUri .
        ?sourceUri <https://purl.org/patternpedia#hasName> ?sourceName .
        OPTIONAL { ?linkUri <https://purl.org/patternpedia#hasDescription> ?description }
      }`;

    for (const entry of patterns) {
      graphs.push(IriConverter.getFileName(entry.sourceUri.value));
    }

    return this.executor.exec(qry, graphs);
  }

  mapTriples(triples: any, uri?: string): Promise<Map<string, Relation>> {
    const data = [];

    for (const t of triples) {
      const item: Relation = {
        relationId: IriConverter.convertIdToIri(t.linkUri.value),
        label: t.sourceName.value,
        patternId: IriConverter.convertIriToId(t.sourceUri.value),
        direction: 'incoming',
        hasDescription: t.description ? true : false
      };

      data.push(item);
    }

    const result = new Map<string, Relation>();
    for (const item of data) {
      result.set(item.patternId, item);
    }

    return Promise.resolve(result);
  }
}