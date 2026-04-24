# JomAI Badminton Court Booking System

A modern badminton court booking system with AI-powered features and matchmaking capabilities.

## Features

### User-Facing Features
- **Court Booking**: Easy-to-use interface for booking badminton courts
- **Matchmaking Board**: Find players to share courts with or post available slots
- **Last-Minute Deals**: Get discounted rates for cancelled slots
- **AI Suggestions**: Smart recommendations for optimal booking times

### Behind-the-Scenes Features
- **Priority Scoring**: Intelligent player scoring based on booking history and behavior
- **Smart Suggestions**: AI-powered recommendations for nearby courts when preferred courts are full
- **Real-time Analytics**: Admin dashboard with booking trends and court utilization

## Technology Stack

- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **AI**: Puter.js (GPT-4o, free tier)
- **Backend**: Puter.js (KV store + file system)
- **Styling**: TailwindCSS
- **Charts**: Chart.js
- **Hosting**: Netlify (free, drag-and-drop deployment)

## Quick Start

### Demo Mode
The application automatically runs in demo mode if Puter.js is not available. This includes:
- Mock booking data
- Sample matchmaking slots
- Simulated AI suggestions
- Pre-populated admin dashboard

### Live Mode (with Puter.js)
1. Create a free account at [puter.ai](https://puter.ai)
2. The app will automatically detect Puter.js and switch to live mode
3. All data will be persisted to your Puter storage

## File Structure

```
/project
├── index.html          # Main booking page
├── matchmaking.html    # Matchmaking board
├── admin.html         # Admin dashboard
├── style.css          # Custom styles
├── app.js             # Main application logic
└── README.md          # This file
```

## Deployment

### Netlify (Recommended)
1. Drag and drop the entire project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Your site will be live instantly at a random URL
3. Optional: Add a custom domain

### Other Static Hosting
The app works with any static hosting service that supports:
- HTML/CSS/JavaScript files
- HTTPS (required for Puter.js)

## Usage

### For Users
1. **Book a Court**: Select date, time, and preferred court
2. **Enable Sharing**: Toggle "Open to sharing" to find playing partners
3. **Check Matchmaking**: Browse available slots posted by other players
4. **Grab Deals**: Look for last-minute cancellations with discounts

### For Admins
1. **Monitor Activity**: View booking trends and court utilization
2. **Manage Priority Scores**: See player rankings and access levels
3. **AI Insights**: Get actionable recommendations for court management
4. **Track Cancellations**: Monitor patterns and optimize scheduling

## API Integration

### Puter.js Features Used
- **AI Chat**: `puter.ai.chat()` for smart suggestions
- **KV Storage**: `puter.kv.set/get/delete()` for data persistence
- **Authentication**: `puter.auth.signIn()` for user management

### Data Storage Structure
```
booking_[id]        # Court bookings
matchmaking_[id]    # Available slots for sharing
priority_scores     # Player priority rankings
```

## Customization

### Adding Courts
Edit the `getAvailableCourts()` function in `app.js` to add more courts.

### Time Slots
Modify the time slot options in the HTML select elements.

### Styling
Customize colors and layouts in `style.css` or modify TailwindCSS classes.

## Troubleshooting

### Demo Mode Not Working
- Check browser console for JavaScript errors
- Ensure all files are in the same directory
- Verify TailwindCSS CDN is accessible

### Puter.js Issues
- Make sure you're logged into Puter.ai
- Check network connectivity
- Verify API key permissions

### Mobile Responsiveness
- Test on different screen sizes
- Adjust breakpoints in TailwindCSS classes if needed

## Security Notes

- No sensitive data is stored locally
- All user data is handled through Puter.js secure storage
- Demo mode uses only mock data
- No API keys or credentials in the codebase

## Performance

- Lightweight JavaScript (~15KB minified)
- Minimal external dependencies
- Fast loading with CDN resources
- Efficient DOM manipulation

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in both demo and live modes
5. Submit a pull request

## License

MIT License - feel free to use for commercial or personal projects.

## Support

For issues related to:
- **Puter.js**: Contact Puter.ai support
- **Hosting**: Check your hosting provider's documentation
- **Code**: Open an issue in the project repository

---

**Hackathon Tips:**
- Pre-login to Puter.ai before presenting
- Have demo mode ready as backup
- Focus on the AI matchmaking and priority scoring features
- Show the admin dashboard for data insights
