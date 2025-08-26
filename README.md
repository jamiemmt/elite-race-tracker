# Clean So Far

A web application for tracking elite race finish times with functionality to mark banned athletes.

## Features

- **Athlete Management**: Add, edit, and view athlete profiles with ban history
- **Race Tracking**: Record and organize races by category, distance, and location
- **Result Management**: Record race results with precise finish times
- **Fastest Times**: View the fastest times across different race categories and distances
- **Ban Transparency**: Clearly mark athletes who have served bans with strikethrough text
- **Filtering**: Filter results to show only clean athletes or include banned athletes

## Tech Stack

- **Frontend**: React, React Bootstrap, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Additional Libraries**: Axios, Chart.js, React Icons

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/elite-race-tracker.git
   cd elite-race-tracker
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   npm run install-client
   ```

4. Create a `.env` file in the root directory with the following:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```

5. Run the development server:
   ```
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Usage

### Adding Athletes

1. Navigate to the "Athletes" page
2. Click "Add New Athlete"
3. Fill in the athlete's details
4. Click "Save Athlete"

### Recording Bans

1. Navigate to an athlete's profile
2. Click "Add Ban Record"
3. Enter the ban details (reason, start date, end date)
4. Click "Save Ban Record"

### Adding Races

1. Navigate to the "Races" page
2. Click "Add New Race"
3. Fill in the race details
4. Click "Save Race"

### Recording Results

1. Navigate to the "Results" page
2. Click "Add New Result"
3. Select the athlete, race, and enter the finish time
4. Click "Save Result"

### Viewing Fastest Times

1. Navigate to the "Fastest Times" page
2. Use the filters to select the distance and unit
3. Toggle "Include Banned Athletes" to show or hide banned athletes

## Deployment

### Heroku Deployment

The application is deployed to Heroku with the following components:

1. **Web Server**: The Express backend API serving scraper endpoints
2. **Scheduled Tasks**: Using Heroku Scheduler to run daily scraper jobs
3. **Database**: MongoDB Atlas for storing race results

### Deployment Steps

1. Create a Heroku app:
   ```
   heroku create elite-race-tracker
   ```

2. Set environment variables:
   ```
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   ```

3. Deploy the application:
   ```
   git push heroku main
   ```

4. Set up Heroku Scheduler:
   ```
   heroku addons:create scheduler:standard
   heroku addons:open scheduler
   ```
   Then add a daily job to run: `node server/scripts/run-all-scrapers.js`

### Continuous Deployment

The application is set up for continuous deployment from GitHub. Any push to the main branch will trigger an automatic deployment to Heroku.

## License

MIT
