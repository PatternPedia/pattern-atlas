import { Component, OnInit } from '@angular/core';
import { DialogData, MdEditorComponent } from '../../../md-editor/md-editor.component';
import { MatDialog } from '@angular/material';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'pp-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss']
})
export class DateComponent implements OnInit {

  data: any;
  date = new FormControl(new Date());
  title = '';

  showActionButtons = false;

  constructor(private dialog: MatDialog) {
  }

  ngOnInit() {
  }

  openEditor(): void {
    const dialogRef = this.dialog.open(MdEditorComponent,
      {data: {content: this.data}});
    dialogRef.afterClosed().subscribe(async (result: DialogData) => {
    });
  }
}