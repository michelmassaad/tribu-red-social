import { SetMetadata } from '@nestjs/common';

// Cuando ponés @Public() arriba de una ruta,
// le decís al guard que la deje pasar sin verificar el token
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);