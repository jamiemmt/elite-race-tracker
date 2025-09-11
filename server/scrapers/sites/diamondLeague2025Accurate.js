const BaseScraper = require('../BaseScraper');

class DiamondLeague2025Accurate extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League 2025 Accurate';
    this.source = 'diamondLeague2025Accurate';
  }

  async scrape(options = {}) {
    const { topN = 50 } = options;
    
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

      // Women's 200m
      { position: 1, athlete: 'Brittany Brown', country: 'USA', event: "Women's 200m", time: '22.13', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 2, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 200m", time: '22.18', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 3, athlete: 'Marie-Josée Ta Lou-Smith', country: 'CIV', event: "Women's 200m", time: '22.25', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 4, athlete: 'Anavia Battle', country: 'USA', event: "Women's 200m", time: '22.49', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 5, athlete: 'Amy Hunt', country: 'GBR', event: "Women's 200m", time: '22.61', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 6, athlete: 'Jenna Prandini', country: 'USA', event: "Women's 200m", time: '22.70', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 7, athlete: 'Jessika Gbai', country: 'CIV', event: "Women's 200m", time: '22.71', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },
      { position: 8, athlete: 'Mckenzie Long', country: 'USA', event: "Women's 200m", time: '22.72', venue: 'Zurich', date: '2025-08-28', meeting: 'Diamond League Final 2025' },

      // Men's 100m
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
    ];

    // Convert times to seconds and format properly
    const processedResults = results.map(result => {
      const timeInSeconds = this.convertTimeToSeconds(result.time);
      return {
        ...result,
        timeInSeconds,
        formattedTime: result.time,
        raceKey: `${result.meeting} - ${result.event}`,
        meetingName: result.meeting,
        meetingDate: result.date,
        venue: result.venue
      };
    });

    // Apply topN limit if specified
    if (topN && topN > 0) {
      return processedResults.slice(0, topN);
    }

    return processedResults;
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
}

module.exports = new DiamondLeague2025Accurate();
