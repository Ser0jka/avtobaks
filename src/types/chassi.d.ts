declare module "chassi" {
  export interface DecodeResult {
    vin: string;
    valid: boolean;
    manufacturer: string | null;
    model: string | null;
    year: number | null;
    possibleYears: number[];
    country: string | null;
    countryCode: string | null;
    confidence: number;
    disclaimer: string;
  }

  export interface ValidateResult {
    valid: boolean;
    vin: string;
    normalizedVin: string;
    errors: string[];
    details: {
      lengthValid: boolean;
      charactersValid: boolean;
      checkDigitValid: boolean;
      providedCheckDigit: string;
      calculatedCheckDigit: string;
    };
  }

  export function decodeVin(vin: string): DecodeResult;
  export function validateVin(vin: string): ValidateResult;
}
