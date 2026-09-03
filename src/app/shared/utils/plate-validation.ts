const OLD_PLATE_PATTERN =
  /^(VI|AB|A|AL|O|AV|BA|B|BU|CC|CA|S|CS|CE|CR|C|CO|CU|GI|GE|GC|GR|GU|SS|H|HU|IB|PM|J|LO|LE|LU|L|M|ML|MU|MA|NA|OU|OR|P|PO|SA|SG|SE|SO|T|TF|TE|TO|V|VA|BI|ZA|Z)([0-9]{4}[A-Z]{1,2}|[0-9]{5,6})$/;
const NEW_PLATE_PATTERN = /^[0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;

export const FOREIGN_PLATE_MAX_LENGTH = 10;

export function isValidPlate(value: string, foreign: boolean): boolean {
  const plate = value.replace(/\s/g, '').toUpperCase();
  if (!plate) return false;
  if (foreign) return plate.length > 3 && plate.length <= FOREIGN_PLATE_MAX_LENGTH;
  return OLD_PLATE_PATTERN.test(plate) || NEW_PLATE_PATTERN.test(plate);
}
