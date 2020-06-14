import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TdTextEditorComponent } from '@covalent/text-editor';
import { Candidate, CandidateManagementService, CandidateManagementStore } from 'src/app/core/candidate-management';
import PatternLanguageSchemaModel from 'src/app/core/model/pattern-language-schema.model';
import PatternSectionSchema from 'src/app/core/model/hal/pattern-section-schema.model';
import { patternLanguageNone } from 'src/app/core/component/pattern-language-picker/pattern-language-picker.component';
import { PatternService } from 'src/app/core/service/pattern.service';
import * as marked from 'marked';
import * as MarkdownIt from 'markdown-it';
import * as markdownitKatex from 'markdown-it-katex';

@Component({
  selector: 'pp-candidate-management-detail',
  templateUrl: './candidate-management-detail.component.html',
  styleUrls: ['./candidate-management-detail.component.scss']
})
export class CandidateManagementDetailComponent implements OnInit {

  @ViewChild('textEditor') private _textEditor: TdTextEditorComponent;
  // @ViewChild('detailView') detailView: ElementRef;

  markdown;
  value;

  candidateMarkdown: string = '';
  options: any = {};

  candidate: Candidate;
  private oldCandidate: Candidate;

  private patternSchema: PatternSectionSchema[];

  disabled: boolean = true;
  pattern: boolean = false;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private candidateManagementService: CandidateManagementService,
    public candidateStore: CandidateManagementStore,
    private patternService: PatternService,
  ) { }

  ngOnInit(): void {
    this.candidateStore.candidate.subscribe((_candidate: Candidate) => {
      // console.log(_candidate);
      if (_candidate && this.router.url.includes('detail')) {
        this.disabled = true;
        this.candidate = _candidate;
        this.contentToMarkdown();

      } else if (_candidate && this.router.url.includes('edit')) {
        this.candidate = _candidate;
        this.contentToMarkdown();
        this.edit();

      } else if (!_candidate && window.history.state.data) {
        this.candidate = window.history.state.data as Candidate
        this.contentToMarkdown();
        this.edit();

      } else {
        this.disabled = false;
        this.candidate = new Candidate(null, 'New Candidate', null, null);
        this.patternLanguageSelectedChange(patternLanguageNone);
      }
    });
  }

  // CHANGE MARKDOWN
  contentToMarkdown() {
    console.log(this.candidate);
    this.candidateMarkdown = `# ${this.candidate.name}\n`;
    for (let key in this.candidate.content) {
      this.candidateMarkdown = this.candidateMarkdown + `## ${key}\n${this.candidate.content[key]}\n`;
    }
    this.markdown = new MarkdownIt();
    this.markdown.use(markdownitKatex);
    this.value = this.markdown.render(this.candidateMarkdown);
  }

  /** BUTTONS */
  edit() {
    this.oldCandidate = Object.assign({}, this.candidate);
    this.disabled = false;
  }

  cancel() {
    if (!this.oldCandidate) this.exit();
    this.candidate = this.oldCandidate;
    this.disabled = true
  }

  exit() {
    this.router.navigateByUrl('/candidate')
  }

  /** Pattern Language */
  patternLanguageSelectedChange(patternLanguage: PatternLanguageSchemaModel) {
    this.candidate.patternLanguageId = patternLanguage.patternLanguageId;
    this.candidate.patternLanguageName = patternLanguage.patternLanguageName;
    const content: { [key: string]: string } = {};
    for (let section of patternLanguage.patternSchema) {
      content[section.label] = 'Enter your input for this section here.';
    }
    this.candidate.content = content;
    this.contentToMarkdown();
  }

  /** Pattern */
  confirmPattern() {
    this.pattern = !this.pattern;
  }

  createPattern() {
    console.log('Create Candidate: ', this.candidate);

    this.patternService.savePattern(`http://localhost:8080/patternLanguages/${this.candidate.patternLanguageId}/patterns`, this.candidate).subscribe(result => {
      this.router.navigate(['patternLanguages', this.candidate.patternLanguageId]);
    })
  }

  cancelPattern() {
    this.pattern = !this.pattern;
  }

  /** SERVICE */
  /** ISSUE */
  createContent(): boolean {
    const textEditorValue = marked.lexer(this._textEditor.value);
    const content: { [key: string]: string } = {};
    var currentKey;
    console.log(textEditorValue);
    for (let line of textEditorValue) {
      // var line = textEditorValue[_i];
      // NAME
      if (line.type == 'heading' && line.depth == 1) {
        this.candidate.name = line.text;
        // HEADING
      } else if (line.type == 'heading' && line.depth == 2) {
        currentKey = line.text;
        content[currentKey] = '';
        // PARAGRAPH
      } else if (line.type == 'paragraph' || line.type == 'code') {
        content[currentKey] = content[currentKey] + line.text;
        // SPACE
      } else if (line.type == 'space') {
        content[currentKey] = content[currentKey] + '\n\n';
      } else {
        console.error('Type not supported yet: ', line.type);
        return false;
      }
    }
    this.candidate.content = content;
    return true;
  }

  submit() {
    if (this.createContent()) {
      this.candidate.uri = `/candidates/${this.candidate.name}`
      this.candidate.id ? this.update() : this.create();
    }
  }

  create() {
    this.candidateManagementService.createCandidate(this.candidate).subscribe(result => {
      this.candidate = result;
      this.contentToMarkdown();
      this.disabled = true;
    })
  }

  update() {
    this.candidateManagementService.updateCandidate(this.candidate).subscribe(result => {
      this.candidate = result;
      this.contentToMarkdown();
      this.disabled = true;
    })
  }

  delete() {
    this.candidateManagementService.deleteCandidate(this.candidate).subscribe(result => {
      this.exit();
    })
  }
}
