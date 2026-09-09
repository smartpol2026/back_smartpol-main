import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador personalizado que verifica que el string no contenga espacios en blanco
 * Se aplica a identificación y email (pero NO a nombres/apellidos que pueden tener espacios)
 */
@ValidatorConstraint({ name: 'NoWhitespace', async: false })
export class NoWhitespaceValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    // Verificar que no haya espacios en blanco (después de trim)
    // Este validador es SOLO para identification y email
    const trimmedValue = value.trim();
    // No permitir espacios en blanco dentro del string
    return !/\s/.test(trimmedValue) && trimmedValue.length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} no puede contener espacios en blanco`;
  }
}

/**
 * Validador para campos que solo deben tener números
 */
@ValidatorConstraint({ name: 'NumericOnly', async: false })
export class NumericOnlyValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) {
      return true; // Campo opcional
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Solo números, sin espacios ni caracteres especiales
    return /^\d+$/.test(value.trim());
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} debe contener solo números`;
  }
}

/**
 * Validador para nombres y apellidos
 * Permite espacios en el medio pero NO al inicio ni al final
 */
@ValidatorConstraint({ name: 'NameFormat', async: false })
export class NameFormatValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }

    const trimmedValue = value.trim();

    // No puede estar vacío después de trim
    if (trimmedValue.length === 0) {
      return false;
    }

    // No debe haber espacios al inicio o final (después de trim, ya no debe haber)
    // Si el valor original tiene espacios al inicio/final, será diferente al trim
    if (value !== trimmedValue) {
      return false;
    }

    // Validar que no haya múltiples espacios consecutivos
    if (/\s{2,}/.test(value)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} no puede tener espacios al inicio o final, ni espacios múltiples`;
  }
}

/**
 * Validador para teléfono - solo números
 */
@ValidatorConstraint({ name: 'PhoneFormat', async: false })
export class PhoneFormatValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!value) {
      return true; // Campo opcional
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Solo números, sin espacios ni caracteres especiales
    return /^\d+$/.test(value.trim());
  }

  defaultMessage(args: ValidationArguments) {
    return `El campo ${args.property} debe contener solo números`;
  }
}
