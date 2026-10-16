/* ==========================================================================
   Schede paese statiche: valuta, prese, tensione, lato di guida, emergenze.
   Sono dati che cambiano di rado, quindi stanno qui invece che dietro un'API
   (REST Countries dal 2026 vuole una chiave e vieta di tenere i dati in copia).
   Dove un dato non è certo, manca: meglio niente che un numero sbagliato.
   prese: lettere IEC (https://www.iec.ch/world-plugs) · guida: 'dx' o 'sx'
   ========================================================================== */
const UE = { emergenza: '112', volt: 230 };
export const PAESI = {
  IT: { nome: 'Italia', valuta: 'EUR', prese: 'F, L', guida: 'dx', ...UE },
  FR: { nome: 'Francia', valuta: 'EUR', prese: 'E', guida: 'dx', ...UE },
  ES: { nome: 'Spagna', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  PT: { nome: 'Portogallo', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  DE: { nome: 'Germania', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  AT: { nome: 'Austria', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  NL: { nome: 'Paesi Bassi', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  BE: { nome: 'Belgio', valuta: 'EUR', prese: 'E', guida: 'dx', ...UE },
  LU: { nome: 'Lussemburgo', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  IE: { nome: 'Irlanda', valuta: 'EUR', prese: 'G', guida: 'sx', ...UE },
  GR: { nome: 'Grecia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  HR: { nome: 'Croazia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  SI: { nome: 'Slovenia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  SK: { nome: 'Slovacchia', valuta: 'EUR', prese: 'E', guida: 'dx', ...UE },
  CZ: { nome: 'Repubblica Ceca', valuta: 'CZK', prese: 'E', guida: 'dx', ...UE },
  PL: { nome: 'Polonia', valuta: 'PLN', prese: 'E', guida: 'dx', ...UE },
  HU: { nome: 'Ungheria', valuta: 'HUF', prese: 'F', guida: 'dx', ...UE },
  RO: { nome: 'Romania', valuta: 'RON', prese: 'F', guida: 'dx', ...UE },
  BG: { nome: 'Bulgaria', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  DK: { nome: 'Danimarca', valuta: 'DKK', prese: 'C, F, K', guida: 'dx', ...UE },
  SE: { nome: 'Svezia', valuta: 'SEK', prese: 'F', guida: 'dx', ...UE },
  FI: { nome: 'Finlandia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  EE: { nome: 'Estonia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  LV: { nome: 'Lettonia', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  LT: { nome: 'Lituania', valuta: 'EUR', prese: 'F', guida: 'dx', ...UE },
  MT: { nome: 'Malta', valuta: 'EUR', prese: 'G', guida: 'sx', ...UE },
  CY: { nome: 'Cipro', valuta: 'EUR', prese: 'G', guida: 'sx', ...UE },
  NO: { nome: 'Norvegia', valuta: 'NOK', prese: 'F', guida: 'dx', emergenza: '112', volt: 230 },
  IS: { nome: 'Islanda', valuta: 'ISK', prese: 'F', guida: 'dx', emergenza: '112', volt: 230 },
  CH: { nome: 'Svizzera', valuta: 'CHF', prese: 'J, C', guida: 'dx', emergenza: '112', volt: 230 },
  GB: { nome: 'Regno Unito', valuta: 'GBP', prese: 'G', guida: 'sx', emergenza: '999 o 112', volt: 230 },
  ME: { nome: 'Montenegro', valuta: 'EUR', prese: 'F', guida: 'dx', volt: 230 },
  AL: { nome: 'Albania', valuta: 'ALL', prese: 'F', guida: 'dx', volt: 230 },
  RS: { nome: 'Serbia', valuta: 'RSD', prese: 'F', guida: 'dx', volt: 230 },
  TR: { nome: 'Turchia', valuta: 'TRY', prese: 'F', guida: 'dx', emergenza: '112', volt: 230 },
  MA: { nome: 'Marocco', valuta: 'MAD', prese: 'C, E', guida: 'dx', volt: 220 },
  EG: { nome: 'Egitto', valuta: 'EGP', prese: 'C, F', guida: 'dx', volt: 220 },
  AE: { nome: 'Emirati Arabi Uniti', valuta: 'AED', prese: 'G', guida: 'dx', volt: 230 },
  US: { nome: 'Stati Uniti', valuta: 'USD', prese: 'A, B', guida: 'dx', emergenza: '911', volt: 120 },
  CA: { nome: 'Canada', valuta: 'CAD', prese: 'A, B', guida: 'dx', emergenza: '911', volt: 120 },
  MX: { nome: 'Messico', valuta: 'MXN', prese: 'A, B', guida: 'dx', emergenza: '911', volt: 127 },
  JP: { nome: 'Giappone', valuta: 'JPY', prese: 'A, B', guida: 'sx', emergenza: '110 polizia · 119 ambulanza', volt: 100 },
  TH: { nome: 'Thailandia', valuta: 'THB', prese: 'A, B, C, O', guida: 'sx', volt: 230 },
  AU: { nome: 'Australia', valuta: 'AUD', prese: 'I', guida: 'sx', emergenza: '000', volt: 230 },
  NZ: { nome: 'Nuova Zelanda', valuta: 'NZD', prese: 'I', guida: 'sx', emergenza: '111', volt: 230 }
};
