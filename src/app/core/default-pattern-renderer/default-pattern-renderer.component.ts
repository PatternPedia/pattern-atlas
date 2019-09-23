import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DefaultPatternLoaderService } from '../service/loader/default-pattern-loader.service';
import { DefaultPlLoaderService } from '../service/loader/default-pl-loader.service';
import { PatternOntologyService } from '../service/pattern-ontology.service';
import { ToasterService } from 'angular2-toaster';
import { SectionResponse } from '../service/data/SectionResponse.interface';
import { PlRestrictionLoaderService } from '../service/loader/pattern-language-loader/pl-restriction-loader.service';
import { PatternpropertyDirective } from '../component/markdown-content-container/patternproperty.directive';
import { PatternLanguageSectionRestriction } from '../model/PatternLanguageSectionRestriction.model';
import { IriConverter } from '../util/iri-converter';
import { DividerComponent } from '../component/divider/divider.component';
import { DataRenderingComponent } from '../component/markdown-content-container/interfaces/DataRenderingComponent.interface';
import { PatternLanguagePatterns } from '../model/pattern-language-patterns.model';
import { GithubPersistenceService } from '../service/github-persistence.service';
import { CookieService } from 'ngx-cookie-service';
import { MatDialog } from '@angular/material';
import { CreatePatternRelationComponent, DialogDataResult } from '../component/create-pattern-relation/create-pattern-relation.component';
import Pattern from '../model/pattern.model';
import { DirectedPatternRelationDescriptorIndividual } from '../model/directed-pattern-relation-descriptor-individual';
import { PatternLanguageRelations } from '../model/pattern-language-relations.model';
import { PatternRelationDescriptorDirection } from '../model/pattern-relation-descriptor-direction.enum';
import { UndirectedPatternRelationDescriptorIndividual } from '../model/undirected-pattern-relation-descriptor-individual';
import { DefaultPatternDirectedRelationsLoaderService } from '../service/loader/pattern-language-loader/default-pattern-directed-relations-loader.service';
import { PatternRelations } from '../model/pattern-relations';
import { DefaultPatternUndirectedRelationsLoaderService } from '../service/loader/pattern-language-loader/default-pattern-undirected-relations-loader.service';
import { switchMap, tap } from 'rxjs/internal/operators';
import { EMPTY } from 'rxjs';
import { MarkdownPatternSectioncontentComponent } from '../component/markdown-content-container/markdown-pattern-sectioncontent/markdown-pattern-sectioncontent.component';

@Component({
  selector: 'pp-default-pattern-renderer',
  templateUrl: './default-pattern-renderer.component.html',
  styleUrls: ['./default-pattern-renderer.component.scss']
})
export class DefaultPatternRendererComponent implements OnInit {
  private sectionRestritions: Map<string, PatternLanguageSectionRestriction[]>;
  private patterns: Map<string, any>;
  private pattern: Pattern;
  private directedPatternRelations: DirectedPatternRelationDescriptorIndividual[];
  private undirectedPatternRelations: UndirectedPatternRelationDescriptorIndividual[];
  private allRelations: PatternRelations = new PatternRelations();
  private patternList: Pattern[];

  constructor(private patternLoaderService: DefaultPatternLoaderService,
              private sectionLoader: PlRestrictionLoaderService, private plLoader: DefaultPlLoaderService, private activatedRoute: ActivatedRoute,
              private pos: PatternOntologyService, private toasterService: ToasterService, private cdr: ChangeDetectorRef,
              private componentFactoryResolver: ComponentFactoryResolver,
              private githubPersistenceService: GithubPersistenceService,
              private cookieService: CookieService,
              private directedRelationsLoaderService: DefaultPatternDirectedRelationsLoaderService,
              private undirectedRelationsLoaderService: DefaultPatternUndirectedRelationsLoaderService,
              public dialog: MatDialog) {
  }

  @ViewChild(PatternpropertyDirective) ppPatternproperty: PatternpropertyDirective;
  plIri: string;
  patternIri: string;
  patternName: string;
  patternNameProperty: string;
  sections: SectionResponse[];
  isLoadingPattern = true;
  isLoadingSection = true;
  isEditingEnabled = false;



  ngOnInit() {

    this.plIri = IriConverter.convertIdToIri(this.activatedRoute.snapshot.paramMap.get('plid'));
    this.patternIri = IriConverter.convertIdToIri(this.activatedRoute.snapshot.paramMap.get('pid'));
    this.isEditingEnabled = !!this.cookieService.get('patternpedia_github_token');

    this.loadInfos().then(() => {
      const viewContainerRef = this.ppPatternproperty.viewContainerRef;
      viewContainerRef.clear();

      const componentDividerFactory = this.componentFactoryResolver.resolveComponentFactory(DividerComponent);
      this.sections.forEach((sec: SectionResponse) => {
        this.createSectionComponent(sec.section.value, viewContainerRef, componentDividerFactory);
      });
    });


  }


  private async loadInfos(): Promise<any> {


    await this.pos.loadUrisToStore([{token: null, value: this.plIri}]);

    // load patternlanguage and patternlanguage-Patterns file
    const imports = await this.pos.getOWLImports(this.plIri);
    const importedPatternIris = imports.map(i => i.import);
    await  this.pos.loadUrisToStore(importedPatternIris);



    //  load all the data from patternlanguage
    this.plLoader.supportedIRI = this.plIri;
    this.patterns = await this.plLoader.loadContentFromStore();
    this.patternList = Array.from(this.patterns.values()).map(it => it.toPattern(this.plIri));
    this.pattern = this.patterns.get(this.patternIri).toPattern(this.plIri);
    this.patternNameProperty = IriConverter.getFileName(this.plIri) + '#hasName';
    this.isLoadingPattern = false;

    // load pattern relations (links)
    this.directedRelationsLoaderService.supportedIRI = IriConverter.getRelationListIriForPLIri(this.plIri);
    this.directedRelationsLoaderService.patterns = this.patternList;
    this.allRelations.directed = Array.from((await this.directedRelationsLoaderService.loadContentFromStore()).values());


    this.undirectedRelationsLoaderService.supportedIRI = IriConverter.getRelationListIriForPLIri(this.plIri);
    this.undirectedRelationsLoaderService.patterns = this.patternList;
    this.allRelations.undirected = Array.from((await this.undirectedRelationsLoaderService.loadContentFromStore()).values());
    this.updateUIForPatternRelations();

    // load section restrictions to be able to get the type for a section
    this.sectionLoader.supportedIRI = this.plIri;
    this.sectionRestritions = await this.sectionLoader.loadContentFromStore();


    // get ordered sections
    this.sections = await this.plLoader.getPLSections(this.plIri);
    this.isLoadingSection = false;


    if (!this.pattern) {
      Promise.reject(null);

    } else {
      Promise.resolve(null);
    }
  }

  getPatternName(uri: string): string {
    if (!uri) {
      return '';
    }
    if (this.patterns.size > 0) {
      return this.patterns.get(uri).sectionProperties.get(this.patternNameProperty)[0];
    }
    return '';

  }

  private createSectionComponent(section: string, viewContainerRef: any, componentDividerFactory) {
    const properties = this.pattern.sectionsProperties.get(section);
    if (section.indexOf('#has') !== -1) {
      const sectionTitle = section.split('#has')[1].replace(/([A-Z])/g, ' $1').trim();

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(MarkdownPatternSectioncontentComponent);
      const componentRef = viewContainerRef.createComponent(componentFactory);
      const instance = (<DataRenderingComponent>componentRef.instance);
      instance.data = properties.join('\n');
      instance.title = sectionTitle;
      instance.isEditingEnabled = this.isEditingEnabled;
      instance.changeContent.subscribe((data) => {
        this.pattern.sectionsProperties.set(section, [data]);
        this.patterns.set(this.patternIri, this.pattern);
        this.patternList = Array.from(this.patterns.values()).map(it => it.toPattern(this.plIri));
        instance.data = data;
        this.savePatterns();
      });

      viewContainerRef.createComponent(componentDividerFactory); // create divider
    }
  }

  private savePatterns() {

    this.githubPersistenceService.updatePLPatterns(new PatternLanguagePatterns(IriConverter.getPatternListIriForPLIri(this.plIri),
      this.plIri, this.patternList)).subscribe(() => this.toasterService.pop('success', 'Updated patterns'),
      (error) => this.toasterService.pop('error', 'could not update patterns' + error.message));
  }

  addLink() {
    const dialogRef = this.dialog.open(CreatePatternRelationComponent, {
        data: {patternName: this.pattern.name, patterns: this.patternList}
      }
    );
    let relationAdded = false;
    let patternRelations;
    dialogRef.afterClosed().pipe(
      tap((result: DialogDataResult) => {
        relationAdded = this.addRelationCreatedByDialog(result);
        patternRelations = new PatternLanguageRelations(IriConverter.getRelationListIriForPLIri(this.plIri), this.plIri, this.allRelations);
      }),
      switchMap(() =>
        relationAdded ? this.githubPersistenceService.updatePLRelations(patternRelations) : EMPTY)).subscribe(
      () => {
        if (relationAdded) {
          this.toasterService.pop('success', 'Created new Relation');
        }
      },
      (error) => this.toasterService.pop('error', 'Could not create new relation: ', error));
  }

  // adds a relation created by the dialog to the local data and returns whether this was successful (or not, e.g. when simply closing the dialog)
  addRelationCreatedByDialog(dialogResult: DialogDataResult): boolean {
    if (!dialogResult || !dialogResult.toPattern || !dialogResult.direction) {
      return false;
    }
    switch (dialogResult.direction.name) {
      case PatternRelationDescriptorDirection.DirectedRight:
        this.allRelations.directed.push(new DirectedPatternRelationDescriptorIndividual(this.pattern, dialogResult.toPattern,
          dialogResult.description ? dialogResult.description : null));
        break;
      case PatternRelationDescriptorDirection.DirectedLeft:
        this.allRelations.directed.push(new DirectedPatternRelationDescriptorIndividual(dialogResult.toPattern, this.pattern,
          dialogResult.description ? dialogResult.description : null));
        break;
      case PatternRelationDescriptorDirection.UnDirected:
        this.allRelations.undirected.push(new UndirectedPatternRelationDescriptorIndividual(this.pattern, dialogResult.toPattern,
          dialogResult.description ? dialogResult.description : null));
        break;
      default:
        return false;
    }
    this.updateUIForPatternRelations();
    return true;
  }


  private updateUIForPatternRelations() {
    this.directedPatternRelations = this.allRelations.directed.filter((rel: DirectedPatternRelationDescriptorIndividual) =>
      rel.source.iri === this.patternIri || rel.target.iri === this.patternIri);
    this.undirectedPatternRelations = this.allRelations.undirected.filter((rel: UndirectedPatternRelationDescriptorIndividual) =>
      rel.hasPattern.some((pat) => pat.iri === this.patternIri));
    this.cdr.detectChanges();
  }
}
