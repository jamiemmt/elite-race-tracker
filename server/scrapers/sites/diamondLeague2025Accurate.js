const BaseScraper = require('../BaseScraper');

class DiamondLeague2025Accurate extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League 2025 Accurate';
    this.source = 'diamondLeague2025Accurate';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    // If cleanup mode, perform database cleanup first
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Official Diamond League Final 2025 results from FloTrack
    const results = [
      // Men's 200m
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 200m", time: '19.74', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Letsile Tebogo', country: 'BOT', event: "Men's 200m", time: '19.76', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Alexander Ogando', country: 'DOM', event: "Men's 200m", time: '20.14', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Robert Gregory', country: 'USA', event: "Men's 200m", time: '20.20', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Reynier Mena', country: 'CUB', event: "Men's 200m", time: '20.26', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Kyree King', country: 'USA', event: "Men's 200m", time: '20.43', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Joseph Fahnbulleh', country: 'LBR', event: "Men's 200m", time: '20.46', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Udodi Chudi Onwuzurike', country: 'NGR', event: "Men's 200m", time: '20.54', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 200m - Official FloTrack Results
      { position: 1, athlete: 'Brittany Brown', country: 'USA', event: "Women's 200m", time: '22.13', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 200m", time: '22.18', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Marie-Josée Ta Lou-Smith', country: 'CIV', event: "Women's 200m", time: '22.25', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Anavia Battle', country: 'USA', event: "Women's 200m", time: '22.49', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Amy Hunt', country: 'GBR', event: "Women's 200m", time: '22.61', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Jenna Prandini', country: 'USA', event: "Women's 200m", time: '22.70', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Jessika Gbai', country: 'CIV', event: "Women's 200m", time: '22.71', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Mckenzie Long', country: 'USA', event: "Women's 200m", time: '22.72', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 100m - Official FloTrack Results
      { position: 1, athlete: 'Christian Coleman', country: 'USA', event: "Men's 100m", time: '9.97', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Akani Simbine', country: 'RSA', event: "Men's 100m", time: '9.98', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Ackeem Blake', country: 'JAM', event: "Men's 100m", time: '9.99', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Jeremiah Azu', country: 'GBR', event: "Men's 100m", time: '10.03', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Brandon Hicklin', country: 'USA', event: "Men's 100m", time: '10.09', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Trayvon Bromell', country: 'USA', event: "Men's 100m", time: '10.14', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Shaun Maswanganyi', country: 'RSA', event: "Men's 100m", time: '10.19', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Bayanda Walaza', country: 'RSA', event: "Men's 100m", time: '12.10', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 100m
      { position: 1, athlete: 'Julien Alfred', country: 'LCA', event: "Women's 100m", time: '10.76', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Tia Clayton', country: 'JAM', event: "Women's 100m", time: '10.84', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 100m", time: '10.94', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Jacious Sears', country: 'USA', event: "Women's 100m", time: '10.96', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Zoe Hobbs', country: 'NZL', event: "Women's 100m", time: '11.09', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Maia McCoy', country: 'USA', event: "Women's 100m", time: '11.14', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Salomé Kora', country: 'SUI', event: "Women's 100m", time: '11.21', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Patrizia van der Weken', country: 'LUX', event: "Women's 100m", time: '11.26', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 3000m Steeplechase
      { position: 1, athlete: 'Faith Cherotich', country: 'KEN', event: "Women's 3000m Steeplechase", time: '8:57.24', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Norah Jeruto', country: 'KAZ', event: "Women's 3000m Steeplechase", time: '9:10.87', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Marwa Bouzayani', country: 'TUN', event: "Women's 3000m Steeplechase", time: '9:12.03', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Courtney Wayment', country: 'USA', event: "Women's 3000m Steeplechase", time: '9:14.91', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Gabrielle Jennings', country: 'USA', event: "Women's 3000m Steeplechase", time: '9:15.56', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Daisy Jepkemei', country: 'KAZ', event: "Women's 3000m Steeplechase", time: '9:15.98', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Olivia Markezich', country: 'USA', event: "Women's 3000m Steeplechase", time: '9:22.20', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Lea Meyer', country: 'GER', event: "Women's 3000m Steeplechase", time: '9:26.08', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Rihab Dhahri', country: 'TUN', event: "Women's 3000m Steeplechase", time: '9:51.96', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 800m
      { position: 1, athlete: 'Emmanuel Wanyonyi', country: 'KEN', event: "Men's 800m", time: '1:42.37', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Max Burgin', country: 'GBR', event: "Men's 800m", time: '1:42.42', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Marco Arop', country: 'CAN', event: "Men's 800m", time: '1:42.57', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Djamel Sedjati', country: 'ALG', event: "Men's 800m", time: '1:42.84', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Tshepiso Masalela', country: 'BOT', event: "Men's 800m", time: '1:43.16', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Mohamed Attaoui', country: 'ESP', event: "Men's 800m", time: '1:43.35', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Bryce Hoppel', country: 'USA', event: "Men's 800m", time: '1:43.78', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Josh Hoey', country: 'USA', event: "Men's 800m", time: '1:44.25', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 800m
      { position: 1, athlete: 'Audrey Werro', country: 'SUI', event: "Women's 800m", time: '1:55.91', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Georgia Hunter Bell', country: 'GBR', event: "Women's 800m", time: '1:55.96', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Anaïs Bourgoin', country: 'FRA', event: "Women's 800m", time: '1:56.97', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Shafiqua Maloney', country: 'VIN', event: "Women's 800m", time: '1:57.29', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Halimah Nakaayi', country: 'UGA', event: "Women's 800m", time: '1:58.43', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Prudence Sekgodiso', country: 'RSA', event: "Women's 800m", time: '1:58.57', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Sarah Billings', country: 'AUS', event: "Women's 800m", time: '1:58.76', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Addison Wiley', country: 'USA', event: "Women's 800m", time: '1:59.14', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 1500m
      { position: 1, athlete: 'Niels Laros', country: 'NED', event: "Men's 1500m", time: '3:29.20', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Reynold Cheruiyot', country: 'KEN', event: "Men's 1500m", time: '3:29.91', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Phanuel Kipkosgei Koech', country: 'KEN', event: "Men's 1500m", time: '3:30.02', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Timothy Cheruiyot', country: 'KEN', event: "Men's 1500m", time: '3:30.13', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Azeddine Habz', country: 'FRA', event: "Men's 1500m", time: '3:30.39', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Anass Essayi', country: 'MAR', event: "Men's 1500m", time: '3:30.67', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Yared Nuguse', country: 'USA', event: "Men's 1500m", time: '3:30.84', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Samuel Pihlström', country: 'SWE', event: "Men's 1500m", time: '3:31.15', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Robert Farken', country: 'GER', event: "Men's 1500m", time: '3:31.30', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 10, athlete: 'Isaac Nader', country: 'POR', event: "Men's 1500m", time: '3:35.70', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 1500m
      { position: 1, athlete: 'Nelly Chepchirchir', country: 'KEN', event: "Women's 1500m", time: '3:56.99', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Jessica Hull', country: 'AUS', event: "Women's 1500m", time: '3:57.02', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Linden Hall', country: 'AUS', event: "Women's 1500m", time: '3:57.44', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Sinclaire Johnson', country: 'USA', event: "Women's 1500m", time: '3:57.80', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Heather MacLean', country: 'USA', event: "Women's 1500m", time: '3:59.43', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Susan Lokayo Ejore', country: 'KEN', event: "Women's 1500m", time: '3:59.48', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Birke Haylom', country: 'ETH', event: "Women's 1500m", time: '3:59.70', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Sarah Healy', country: 'IRL', event: "Women's 1500m", time: '3:59.90', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Agathe Guillemot', country: 'FRA', event: "Women's 1500m", time: '4:00.40', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 10, athlete: 'Marta Zenoni', country: 'ITA', event: "Women's 1500m", time: '4:00.71', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 11, athlete: 'Joceline Wind', country: 'SUI', event: "Women's 1500m", time: '4:08.37', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' }
      ,
      // Men's 110m Hurdles
      { position: 1, athlete: 'Cordell Tinch', country: 'USA', event: "Men's 110m Hurdles", time: '12.92', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Enrique Llopis', country: 'ESP', event: "Men's 110m Hurdles", time: '13.12', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Jamal Britt', country: 'USA', event: "Men's 110m Hurdles", time: '13.21', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Jason Joseph', country: 'SUI', event: "Men's 110m Hurdles", time: '13.22', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Freddie Crittenden', country: 'USA', event: "Men's 110m Hurdles", time: '13.23', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Trey Cunningham', country: 'USA', event: "Men's 110m Hurdles", time: '13.32', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Orlando Bennett', country: 'JAM', event: "Men's 110m Hurdles", time: '13.35', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Rachid Muratake', country: 'JPN', event: "Men's 110m Hurdles", time: '14.39', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 3000m
      { position: 1, athlete: 'Jimmy Gressier', country: 'FRA', event: "Men's 3000m", time: '7:36.78', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Grant Fisher', country: 'USA', event: "Men's 3000m", time: '7:36.81', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Andreas Almgren', country: 'SWE', event: "Men's 3000m", time: '7:36.82', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Mohamed Abdilaahi', country: 'GER', event: "Men's 3000m", time: '7:37.31', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Biniam Mehary', country: 'ETH', event: "Men's 3000m", time: '7:37.33', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Graham Blanks', country: 'USA', event: "Men's 3000m", time: '7:38.15', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'George Mills', country: 'GBR', event: "Men's 3000m", time: '7:38.71', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Samuel Tefera', country: 'ETH', event: "Men's 3000m", time: '7:38.93', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Jonas Raess', country: 'SUI', event: "Men's 3000m", time: '7:46.82', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 10, athlete: 'Mike Foppen', country: 'NED', event: "Men's 3000m", time: '7:47.04', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 11, athlete: 'Kuma Girma', country: 'ETH', event: "Men's 3000m", time: '7:51.33', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 400m Hurdles
      { position: 1, athlete: 'Karsten Warholm', country: 'NOR', event: "Men's 400m Hurdles", time: '46.70', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Abderrahman Samba', country: 'QAT', event: "Men's 400m Hurdles", time: '47.45', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Ezekiel Nathaniel', country: 'NGR', event: "Men's 400m Hurdles", time: '47.56', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'CJ Allen', country: 'USA', event: "Men's 400m Hurdles", time: '48.00', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Matheus Lima', country: 'BRA', event: "Men's 400m Hurdles", time: '48.21', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Trevor Bassitt', country: 'USA', event: "Men's 400m Hurdles", time: '48.29', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Alastair Chalmers', country: 'GBR', event: "Men's 400m Hurdles", time: '48.88', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Berke Akçam', country: 'TUR', event: "Men's 400m Hurdles", time: '49.01', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 400m Hurdles
      { position: 1, athlete: 'Femke Bol', country: 'NED', event: "Women's 400m Hurdles", time: '52.18', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Emma Zapletalová', country: 'SVK', event: "Women's 400m Hurdles", time: '53.18', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Andrenette Knight', country: 'JAM', event: "Women's 400m Hurdles", time: '53.76', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Gianna Woodruff', country: 'PAN', event: "Women's 400m Hurdles", time: '54.24', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Naomi van den Broeck', country: 'BEL', event: "Women's 400m Hurdles", time: '54.83', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Amalie Iuel', country: 'NOR', event: "Women's 400m Hurdles", time: '55.34', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Ayomide Folorunso', country: 'ITA', event: "Women's 400m Hurdles", time: '55.77', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Zenéy van der Walt', country: 'RSA', event: "Women's 400m Hurdles", time: '56.90', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 100m Hurdles
      { position: 1, athlete: 'Ackera Nugent', country: 'JAM', event: "Women's 100m Hurdles", time: '12.30', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Ditaji Kambundji', country: 'SUI', event: "Women's 100m Hurdles", time: '12.40', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Grace Stark', country: 'USA', event: "Women's 100m Hurdles", time: '12.44', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Danielle Williams', country: 'JAM', event: "Women's 100m Hurdles", time: '12.44', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Nadine Visser', country: 'NED', event: "Women's 100m Hurdles", time: '12.45', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Tonea Marshall', country: 'USA', event: "Women's 100m Hurdles", time: '12.49', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Devynne Charlton', country: 'BAH', event: "Women's 100m Hurdles", time: '12.52', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Kendra Harrison', country: 'USA', event: "Women's 100m Hurdles", time: '12.72', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Selina von Jackowski', country: 'SUI', event: "Women's 100m Hurdles", time: '13.24', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 3000m Steeplechase
      { position: 1, athlete: 'Frederik Ruppert', country: 'GER', event: "Men's 3000m Steeplechase", time: '8:09.02', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Edmund Serem', country: 'KEN', event: "Men's 3000m Steeplechase", time: '8:09.96', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Salaheddine Ben Yazide', country: 'MAR', event: "Men's 3000m Steeplechase", time: '8:14.10', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Daniel Arce', country: 'ESP', event: "Men's 3000m Steeplechase", time: '8:14.36', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Nicolas-Marie Daru', country: 'FRA', event: "Men's 3000m Steeplechase", time: '8:18.68', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Isaac Updike', country: 'USA', event: "Men's 3000m Steeplechase", time: '8:19.47', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Mohamed Amin Jhinaoui', country: 'TUN', event: "Men's 3000m Steeplechase", time: '8:24.75', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Abrham Sime', country: 'ETH', event: "Men's 3000m Steeplechase", time: '8:28.13', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Tim van de Velde', country: 'BEL', event: "Men's 3000m Steeplechase", time: '8:31.52', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Women's 3000m
      { position: 1, athlete: 'Aleshign Baweke', country: 'ETH', event: "Women's 3000m", time: '8:40.56', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Josette Andrews', country: 'USA', event: "Women's 3000m", time: '8:40.95', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Likina Amebaw', country: 'ETH', event: "Women's 3000m", time: '8:41.06', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Georgia Griffith', country: 'AUS', event: "Women's 3000m", time: '8:41.36', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Fantaye Belayneh', country: 'ETH', event: "Women's 3000m", time: '8:42.35', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Marta García', country: 'ESP', event: "Women's 3000m", time: '8:42.63', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Caroline Nyaga', country: 'KEN', event: "Women's 3000m", time: '8:43.43', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Hannah Nuttall', country: 'GBR', event: "Women's 3000m", time: '8:44.74', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 9, athlete: 'Rose Davies', country: 'AUS', event: "Women's 3000m", time: '8:46.11', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 10, athlete: 'Hirut Meshesha', country: 'ETH', event: "Women's 3000m", time: '8:52.48', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' }
    ];

    // Convert times to seconds and format properly
    const processedResults = results.map(result => {
      const timeInSeconds = this.convertTimeToSeconds(result.time);
      return {
        athlete: {
          name: result.athlete,
          country: result.country,
          gender: result.event.includes("Women's") ? 'Female' : 'Male'
        },
        race: {
          name: `Zurich Diamond League Final 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, Switzerland`,
          category: 'Track',
          isElite: true
        },
        finishTime: timeInSeconds,
        formattedTime: result.time,
        position: result.position,
        notes: ''
      };
    });

    // Apply topN limit if specified
    if (topN && topN > 0) {
      return processedResults.slice(0, topN);
    }

    return processedResults;
  }

  getDistanceFromEvent(eventName) {
    if (eventName.includes('100m')) return 100;
    if (eventName.includes('200m')) return 200;
    if (eventName.includes('400m')) return 400;
    if (eventName.includes('800m')) return 800;
    if (eventName.includes('1500m')) return 1500;
    if (eventName.includes('3000m')) return 3000;
    if (eventName.includes('5000m')) return 5000;
    if (eventName.includes('10000m')) return 10000;
    if (eventName.includes('110m Hurdles')) return 110;
    if (eventName.includes('400m Hurdles')) return 400;
    if (eventName.includes('3000m Steeplechase')) return 3000;
    return 0;
  }

  getDistanceUnitFromEvent(eventName) {
    return 'm'; // All events are in meters
  }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Handle different time formats
    if (timeStr.includes(':')) {
      // Format like "1:42.37" or "8:57.24"
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return minutes * 60 + seconds;
      }
    } else {
      // Format like "9.97" (seconds only)
      return parseFloat(timeStr);
    }
    
    return null;
  }

  async performCleanup() {
    console.log('Starting database cleanup...');
    
    try {
      const Result = require('../../models/Result');
      const Race = require('../../models/Race');
      const Athlete = require('../../models/Athlete');

      let deletedResults = 0;
      let deletedAthletes = 0;
      let deletedRaces = 0;

      // Step 1: Remove specific parsing artifact athletes
      const artifactNames = [
        'Bromell finished',
        'Simbine takes', 
        's 200WHAT',
        's 3000mIn',
        'SteeplechaseFaith Cherotich',
        'Britt takes',
        's 110m',
        's 100mCHRISTIAN',
        's 400m'
      ];

      for (const name of artifactNames) {
        const athlete = await Athlete.findOne({ name });
        if (athlete) {
          const resultCount = await Result.deleteMany({ athlete: athlete._id });
          await Athlete.deleteOne({ _id: athlete._id });
          deletedResults += resultCount.deletedCount;
          deletedAthletes += 1;
          console.log(`Deleted athlete "${name}" and ${resultCount.deletedCount} results`);
        }
      }

      // Step 2: Remove fake Eugene Diamond League events (real 2025 Final was in Zurich)
      const fakeEugeneRaces = await Race.find({
        $and: [
          { name: { $regex: /Diamond League Final 2025/ } },
          { location: 'Eugene, USA' }
        ]
      });

      for (const race of fakeEugeneRaces) {
        // Delete all results for this fake race
        const raceResults = await Result.deleteMany({ race: race._id });
        deletedResults += raceResults.deletedCount;
        
        // Delete the fake race
        await Race.deleteOne({ _id: race._id });
        deletedRaces += 1;
        console.log(`Deleted fake Eugene race: ${race.name} and ${raceResults.deletedCount} results`);
      }

      // Step 3: Remove Jakob Ingebrigtsen from any remaining fake Diamond League Final 2025 events
      const jakobAthlete = await Athlete.findOne({ name: 'Jakob Ingebrigtsen' });
      if (jakobAthlete) {
        const remainingFakeRaces = await Race.find({
          name: { $in: [
            'Diamond League Final 2025 - Men\'s 100m',
            'Diamond League Final 2025 - Men\'s 5000m'
          ]}
        });
        
        for (const race of remainingFakeRaces) {
          const jakobResult = await Result.findOne({ 
            athlete: jakobAthlete._id, 
            race: race._id 
          });
          if (jakobResult) {
            await Result.deleteOne({ _id: jakobResult._id });
            deletedResults += 1;
            console.log(`Deleted Jakob Ingebrigtsen from fake race: ${race.name}`);
          }
        }
      }

      // Step 4: Remove results with corrupted time formats
      const corruptedTimeResults = await Result.find({
        $or: [
          { formattedTime: { $regex: /\d+\.\d+\.\d+:\d+/ } }, // "20.14.3:30"
          { formattedTime: { $regex: /^\d+$/ } },              // Just numbers like "400" 
          { formattedTime: { $regex: /\d+:\d+$/ } },           // Incomplete like "2018"
          { formattedTime: { $regex: /\.$/ } }                 // Ends with period
        ]
      });

      if (corruptedTimeResults.length > 0) {
        await Result.deleteMany({ _id: { $in: corruptedTimeResults.map(r => r._id) } });
        deletedResults += corruptedTimeResults.length;
        console.log(`Deleted ${corruptedTimeResults.length} results with corrupted times`);
      }

      // Step 5: Remove existing Zurich Diamond League Final 2025 races to avoid duplicates/typos
      const zurichRaces = await Race.find({
        name: { $regex: /^Zurich Diamond League Final 2025\s*-\s*/ },
      });

      if (zurichRaces.length > 0) {
        const zurichRaceIds = zurichRaces.map(r => r._id);
        const delRes = await Result.deleteMany({ race: { $in: zurichRaceIds } });
        deletedResults += delRes.deletedCount || 0;
        const delRaces = await Race.deleteMany({ _id: { $in: zurichRaceIds } });
        deletedRaces += delRaces.deletedCount || zurichRaces.length;
        console.log(`Deleted Zurich Final 2025 races: ${zurichRaces.length}, results: ${delRes.deletedCount || 0}`);
      }

      // Step 6: Clean up orphaned races and athletes
      const orphanedRaces = await Race.find({
        _id: { $nin: await Result.distinct('race') }
      });
      
      if (orphanedRaces.length > 0) {
        await Race.deleteMany({ _id: { $in: orphanedRaces.map(r => r._id) } });
        deletedRaces += orphanedRaces.length;
        console.log(`Deleted ${orphanedRaces.length} orphaned races`);
      }

      const orphanedAthletes = await Athlete.find({
        _id: { $nin: await Result.distinct('athlete') }
      });
      
      if (orphanedAthletes.length > 0) {
        await Athlete.deleteMany({ _id: { $in: orphanedAthletes.map(a => a._id) } });
        deletedAthletes += orphanedAthletes.length;
        console.log(`Deleted ${orphanedAthletes.length} orphaned athletes`);
      }

      console.log(`Cleanup completed: ${deletedResults} results, ${deletedRaces} races, ${deletedAthletes} athletes deleted`);

    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}

module.exports = new DiamondLeague2025Accurate();
