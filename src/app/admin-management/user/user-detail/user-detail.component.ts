import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm, AbstractControl } from '@angular/forms';
import { UserStore, UserService, UserRole, PAUser } from 'src/app/core/user-management';

@Component({
  selector: 'pp-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {

  user: PAUser;
  userForm: FormGroup;

  roles: UserRole[] = [UserRole.MEMBER, UserRole.EXPERT, UserRole.LIBRARIAN, UserRole.ADMIN];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userFormBuilder: FormBuilder,
    private userStore: UserStore,
    private userService: UserService,
  ) { }

  ngOnInit(): void {

    this.userStore.user.subscribe(user => {
      if (user) {
        this.user = user;
      } else {
        this.user = new PAUser(UserRole.MEMBER)
      }
      this.createForm()
    })
  }

  createForm() {
    this.userForm = this.userFormBuilder.group({
      name: [this.user.name, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      userRole: [this.user.role],
      password: [null],
      confirmPassword: [null]
    },
    {
      validator: ValidatePassword
    });
  }

  onSubmit() {
    console.log('submit');
    this.user.name = this.userForm.get('name').value;
    this.user.email = this.userForm.get('email').value;
    this.user.role = this.userForm.get('userRole').value;
    this.user.password = this.userForm.get('password').value;
    if (this.user.id) {
      this.userService.updateUser(this.user).subscribe(result => {
        console.log('updateUser: ', result);
      })
    } else {
      this.userService.createUser(this.user).subscribe(result => {
        console.log('createdUser: ', result);
      })
    }
  }

  reset() {
    console.log('resetForm');
    this.createForm()
  }

  exit() {
    this.router.navigateByUrl('admin');
  }

}

export function ValidatePassword(formGroup: FormGroup) {
  let pass = formGroup.get('password').value
  let confirmPass = formGroup.get('confirmPassword').value;
  pass === confirmPass ? formGroup.get('confirmPassword').setErrors(null) : formGroup.get('confirmPassword').setErrors({ incorrect: true });
  return true;
}
