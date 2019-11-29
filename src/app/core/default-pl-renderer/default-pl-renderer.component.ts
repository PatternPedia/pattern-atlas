import {ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, ElementRef, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UriConverter} from '../util/uri-converter';
import {MatDialog} from '@angular/material';
import {PatternLanguageService} from '../service/pattern-language.service';
import PatternLanguage from '../model/hal/pattern-language.model';
import {D3Service} from '../../graph/service/d3.service';
import {CardrendererComponent} from '../component/cardrenderer/cardrenderer.component';
import {GraphDisplayComponent} from '../component/graph-display/graph-display.component';
import {EMPTY, forkJoin, Observable} from 'rxjs';
import {Embedded} from '../model/hal/embedded';
import {DirectedEdesResponse} from '../model/hal/directed-edes-response.interface';
import {switchMap, tap} from 'rxjs/operators';
import {UndirectedEdesResponse} from '../model/hal/undirected-edes-response.interface';
import {DirectedEdgeModel} from '../model/hal/directed-edge.model';
import {UndirectedEdgeModel} from '../model/hal/undirected-edge.model';
import * as _ from 'lodash';
import {CreatePatternRelationComponent} from '../component/create-pattern-relation/create-pattern-relation.component';
import {PatternRelationDescriptorService} from '../service/pattern-relation-descriptor.service';
import {ToasterService} from 'angular2-toaster';
import {PatternService} from '../service/pattern.service';
import Pattern from '../model/hal/pattern.model';

@Component({
    selector: 'pp-default-pl-renderer',
    templateUrl: './default-pl-renderer.component.html',
    styleUrls: ['./default-pl-renderer.component.scss']
})
export class DefaultPlRendererComponent implements OnInit {


    patterns: Pattern[] = [];
    patternLanguage: PatternLanguage;
    isLoading = true;
    patternLanguageURI: string;
    @ViewChild('graphWrapper') graph: ElementRef;
    @ViewChild('cardsView') cardsView: ElementRef;
    @ViewChild('displayPLContainer', {read: ViewContainerRef}) loadRenderer;
    rendererComponentInstance: GraphDisplayComponent | CardrendererComponent;
    graphVisible = true;
    isLoadingDataForRenderer: boolean;
    private componentRef: ComponentRef<any>;
    private directedPatternRelations: DirectedEdgeModel[] = [];
    private undirectedPatternRelations: UndirectedEdgeModel[] = [];
    private copyEdgesForSimulation = [];


    constructor(private activatedRoute: ActivatedRoute,
                private cdr: ChangeDetectorRef,
                private dialog: MatDialog,
                private patternLanguageService: PatternLanguageService,
                private patternService: PatternService,
                private patternRelationDescriptorService: PatternRelationDescriptorService,
                private d3Service: D3Service,
                private router: Router,
                private componentFactoryResolver: ComponentFactoryResolver,
                private toasterService: ToasterService) {
    }

    ngOnInit() {
        this.loadData();
    }


    private loadData(): void {
        this.isLoadingDataForRenderer = true;
        this.patternLanguageURI = UriConverter.doubleDecodeUri(this.activatedRoute.snapshot.paramMap.get('patternLanguageUri'));
        if (this.patternLanguageURI) {
            this.patternLanguageService.getPatternLanguageByEncodedUri(this.patternLanguageURI).pipe(
                tap(patternlanguage => this.patternLanguage = patternlanguage),
                switchMap(() => this.patternService.getPatternsByUrl(this.patternLanguage._links.patterns.href)),
                tap(patterns => this.patterns = patterns),
                switchMap(() => this.retrievePatterRelationDescriptorData())).subscribe(
                () => {
                    this.isLoading = false;
                    this.loadRendererForData();
                });


        }
    }

    private initGraph(graphRenderComponent: GraphDisplayComponent = null): void {
        if (!this.patterns || this.patterns.length === 0) {
            return;
        }

        let links = [];
        links = links.concat(this.undirectedPatternRelations);
        links = links.concat(this.directedPatternRelations);
        this.copyEdgesForSimulation = _.clone(links);
        if (graphRenderComponent) {
            graphRenderComponent.data = {
                patterns: this.patterns, edges: links, copyOfLinks: this.copyEdgesForSimulation,
                patternLanguage: this.patternLanguage, patternView: null
            };
            this.isLoadingDataForRenderer = false;
        }


    }

    private getDirectededges(): Observable<Embedded<DirectedEdesResponse>> {
        if (!this.patternLanguage) {
            return EMPTY;
        }
        return this.patternLanguageService.getDirectedEdges(this.patternLanguage).pipe(
            tap((edges) => {
                this.directedPatternRelations = edges._embedded ? edges._embedded.directedEdgeModels : [];
            }));
    }

    private getUndirectededges(): Observable<Embedded<UndirectedEdesResponse>> {
        if (!this.patternLanguage) {
            return EMPTY;
        }
        return this.patternLanguageService.getUndirectedEdges(this.patternLanguage).pipe(
            tap((edges) => {
                this.undirectedPatternRelations = edges._embedded ? edges._embedded.undirectedEdgeModels : [];
            }));
    }


    detectChanges() {
        this.cdr.detectChanges();
    }

    retrievePatterRelationDescriptorData(): Observable<any> {
        const $getDirectedEdges = this.getDirectededges();
        const $getUndirectedEdges = this.getUndirectededges();
        return forkJoin($getDirectedEdges, $getUndirectedEdges);
    }


    toggleRendereringComponent(value: boolean) {
        this.graphVisible = value;
        this.loadRendererForData();
    }

    reloadCurrentRenderingComponent() {
        this.toggleRendereringComponent(this.graphVisible);
    }

    loadRendererForData() {
        this.isLoadingDataForRenderer = true;
        const componentFactory = this.graphVisible ? this.componentFactoryResolver.resolveComponentFactory(GraphDisplayComponent) :
            this.componentFactoryResolver.resolveComponentFactory(CardrendererComponent);

        const viewContainerRef = this.loadRenderer;
        viewContainerRef.clear();

        this.componentRef = viewContainerRef.createComponent(componentFactory);
        const componentInstance = this.componentRef.instance;
        this.rendererComponentInstance = componentInstance;

        if (componentInstance instanceof CardrendererComponent) {
            (<CardrendererComponent>componentInstance).uriEntities = this.patterns;
            this.isLoadingDataForRenderer = false;
        }

        if (componentInstance instanceof GraphDisplayComponent) {
            this.initGraph(<GraphDisplayComponent>componentInstance);
        }
    }

    public addPattern(): void {
        this.router.navigate(['create-patterns'], {relativeTo: this.activatedRoute});
    }


    public addLink() {
        const dialogRef = this.dialog.open(CreatePatternRelationComponent, {
            data: {
                patterns: this.patterns,
                patternlanguage: this.patternLanguage
            }
        });

        dialogRef.afterClosed().pipe(
            switchMap((edge) => {
                const url = edge instanceof DirectedEdgeModel ? this.patternLanguage._links.directedEdges.href : this.patternLanguage._links.undirectedEdges.href;
                return edge ? this.patternRelationDescriptorService.savePatternRelation(url, edge) : EMPTY;
            }),
            switchMap((res) => res ? this.retrievePatterRelationDescriptorData() : EMPTY))
            .subscribe(res => {
                if (res) {
                    this.toasterService.pop('success', 'Added relation');
                    if (this.graphVisible) {
                        this.reloadCurrentRenderingComponent();
                    }
                }
            });
    }

}



