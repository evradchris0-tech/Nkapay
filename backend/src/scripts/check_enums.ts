// Script pour vérifier les enums de rôles
import { RoleMembre } from '../entities/adhesion-tontine.entity';
import { RoleExercice } from '../entities/exercice-membre.entity';

console.log('=== Vérification des enums de rôles ===\n');

console.log('RoleMembre (adhesion-tontine):');
console.log(JSON.stringify(RoleMembre, null, 2));
console.log('Values:', Object.values(RoleMembre));

console.log('\nRoleExercice (exercice-membre):');
console.log(JSON.stringify(RoleExercice, null, 2));
console.log('Values:', Object.values(RoleExercice));

process.exit(0);
