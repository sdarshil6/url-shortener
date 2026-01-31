import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconService } from '../../services/icon.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor, OnInit {
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() icon = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() tooltip = '';
  @Input() maxlength: number | null = null;
  @Output() valueChange = new EventEmitter<string>();

  value = '';
  iconSvg: SafeHtml = '';
  isReadOnly = true; // Start as readonly to prevent autofill
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private iconService: IconService) {}

  ngOnInit(): void {
    if (this.icon) {
      this.iconSvg = this.iconService.getIcon(this.icon);
    }
  }

  get autocompleteValue(): string {
    return this.type === 'password' ? 'new-password' : 'off';
  }

  onFocus() {
    this.isReadOnly = false;
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
