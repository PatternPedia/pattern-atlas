import { Injectable } from '@angular/core';
import Loader from 'src/app/core/model/loader';
import { PatternOntologyService } from 'src/app/core/service/pattern-ontology.service';
import { IriConverter } from 'src/app/core/util/iri-converter';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseIntegrationPatternLoaderService extends Loader<any> {

  constructor(private pos: PatternOntologyService) { 
    super('https://purl.org/patternpedia/patternlanguages/enterpriseintegrationpatterns#EnterpriseIntegrationPatterns', pos);
  }

  loadContentFromStore(uri?: string): Promise<Map<string, any>> {
    return this.selectContentFromStore(uri)
            .then(
                triples => this.mapTriples(triples, uri)
            );
  }

  async selectContentFromStore(uri?: string): Promise<any> {
    // we need a specific pattern of form 'pattern#Pattern'
    if (!uri) return Promise.resolve();

    // get all information about the given pattern uri
    const qry = `SELECT ?name ?groupName ?description
      WHERE {
        <${uri}> <https://purl.org/patternpedia#hasName> ?name .
        <${uri}> <https://purl.org/patternpedia/patternlanguages/enterpriseintegrationpatterns#hasDescription> ?description .
        ?group a <https://purl.org/patternpedia#PatternSetRelationDescriptor> ;
              <https://purl.org/patternpedia#hasLabel> ?groupName ;
              <https://purl.org/patternpedia#hasPattern> <${uri}> .
      }`;
    
    // links URI needed for group
    const graphs = [IriConverter.getFileName(this.supportedIRI), IriConverter.getFileName(uri), 'https://purl.org/patternpedia/patternlanguages/enterpriseintegrationpatterns'];

    return this.executor.exec(qry, graphs);
  }

  mapTriples(triples: any, uri?: string): Promise<Map<string, any>> {
    /*
    triples are objects of form:
    {
      description: {
        token: "literal",
        type: string,
        value: string - description of the selected pattern
      },
      groupName: {
        token: "literal",
        type: string,
        value: string - the group name
      }
      name: {
        token: "literal",
        type: string,
        value: string - the name of the selected pattern
      }
    }

    we convert the given triples to the following object:
    {
      name: string - the name of the pattern,
      group: string - the group name of the pattern,
      description: [string] - descriptions of the pattern
    }
    */
    const data = {};

    for (const t of triples) {
      data['name'] = t.name.value;
      data['groupName'] = t.groupName.value;

      if (!data['description']) {
        data['description'] = Array<string>();
      }

      data['description'].push(t.description.value);
    }

    const result = new Map<string, any>();
    result.set(uri, data);
    
    return Promise.resolve(result);
  }
}
