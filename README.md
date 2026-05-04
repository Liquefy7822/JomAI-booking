# JomAI Badminton Court Booking System with Face Recognition

A modern badminton court booking system featuring face recognition verification, secure payments, and comprehensive admin management.

## 🚀 Features

### **Three Distinct Modes**

#### 1. **User Interface Mode**
- **Court Booking**: Select from 4 different courts with varying price points
- **Real-time Availability**: See available time slots and court status
- **Secure Payment**: Integrated fake payment system (Credit Card, Debit Card, PayPal)
- **Face Registration**: Capture and store facial data for verification
- **Order Summary**: Real-time pricing and booking details

#### 2. **Face Checker Mode**
- **Live Face Scanning**: Real-time camera-based face detection
- **Booking Verification**: Match faces with registered bookings
- **Today's Schedule**: View all bookings for current day
- **Verification Log**: Track all verification attempts and results
- **Status Management**: Mark bookings as verified, failed, or pending

#### 3. **Admin Panel Mode**
- **Booking Management**: View, edit, and cancel all bookings
- **Face Data Control**: Manage stored facial recognition data
- **Analytics Dashboard**: Track revenue, verification rates, and usage
- **Export Functions**: Download booking data and generate reports
- **System Controls**: Clear data, generate reports, export information

### **Core Technologies**
- **Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **Face Recognition**: Browser-based camera integration
- **Styling**: TailwindCSS with dark mode support
- **Storage**: Local storage for demo purposes
- **Payment**: Simulated payment processing

## 📋 System Requirements

### **Browser Requirements**
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### **Hardware Requirements**
- **Camera**: Required for face registration and verification
- **Microphone**: Optional (for future voice features)
- **Modern Device**: Recommended for best performance

## 🛠️ Installation & Setup

### **Quick Start**
1. Download the project files
2. Open `index.html` in a modern web browser
3. Allow camera permissions when prompted
4. Start using the system immediately

### **Local Development**
```bash
# Clone or download the project
cd JomAI-booking

# Start a local server (optional)
python -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

### **Production Deployment**
1. Upload all files to your web server
2. Ensure HTTPS is enabled (required for camera access)
3. Configure camera permissions if needed

## 🎯 How to Use

### **For Players (User Interface)**

1. **Select a Court**
   - Browse available courts (Court A-D)
   - View pricing and features
   - Click to select preferred court

2. **Choose Date & Time**
   - Select booking date
   - Choose available time slot
   - View real-time pricing

3. **Enter Personal Information**
   - Full name
   - Email address
   - Phone number

4. **Payment Processing**
   - Select payment method (demo mode)
   - Complete secure payment
   - Receive confirmation

5. **Face Registration**
   - Click "Capture Face"
   - Allow camera access
   - Position face in frame
   - Capture and store facial data

### **For Staff (Face Checker)**

1. **Start Face Scanner**
   - Click "Start Scanning"
   - Allow camera access
   - Position camera for face detection

2. **Verify Bookings**
   - View today's bookings list
   - Click "Verify" for each booking
   - System matches face with registered data
   - Confirm or deny verification

3. **Monitor Status**
   - View verification results
   - Check verification log
   - Track success/failure rates

### **For Administrators (Admin Panel)**

1. **Monitor Bookings**
   - View all current bookings
   - Check payment and verification status
   - Cancel problematic bookings

2. **Manage Face Data**
   - View registered face data
   - Delete old or invalid data
   - Monitor data storage

3. **Generate Reports**
   - Daily revenue reports
   - Verification statistics
   - Export booking data

4. **System Maintenance**
   - Clear face data storage
   - Export backup data
   - Monitor system health

## 🔧 Technical Architecture

### **Data Flow**
```
User Registration → Face Capture → Payment → Booking Creation → Face Database
                                                            ↓
Face Scanner ← Face Matching ← Verification ← Face Database
                                                            ↓
Admin Panel ← Booking Management ← Verification Log
```

### **Security Features**
- **Face Data Encryption**: Local storage with encryption
- **Payment Security**: Simulated secure payment processing
- **Access Control**: Mode-based access restrictions
- **Data Privacy**: Local storage only (no external servers)

### **Face Recognition Process**
1. **Registration**: High-quality face capture during booking
2. **Storage**: Encrypted local storage of face data
3. **Verification**: Real-time face matching during check-in
4. **Logging**: Complete audit trail of all verifications

## 📊 Pricing Structure

| Court | Type | Price/Hour |
|-------|------|------------|
| Court A | Premium | $20 |
| Court B | Standard | $15 |
| Court C | Standard | $15 |
| Court D | Budget | $10 |

## 🎨 Features & Customization

### **Dark Mode**
- Toggle between light and dark themes
- Persistent user preferences
- Optimized for all lighting conditions

### **Responsive Design**
- Mobile-friendly interface
- Tablet optimization
- Desktop full-featured experience

### **Accessibility**
- Screen reader support
- Keyboard navigation
- High contrast options
- Multi-language ready

## 🔍 Troubleshooting

### **Common Issues**

**Camera Not Working**
- Check browser permissions
- Ensure HTTPS connection
- Try different browser
- Check camera hardware

**Face Recognition Failing**
- Ensure good lighting
- Position face clearly in frame
- Remove glasses/hats if possible
- Recapture face data if needed

**Payment Issues**
- Check payment method selection
- Ensure all fields are filled
- Try different payment method
- Contact admin if persistent

### **Performance Optimization**
- Use modern browser
- Ensure good internet connection
- Clear browser cache regularly
- Update browser to latest version

## 🚀 Future Enhancements

### **Planned Features**
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: AI-powered usage insights
- **Multi-court Support**: Chain management system
- **Integration**: Calendar and payment gateway integration
- **Voice Recognition**: Additional verification method
- **QR Codes**: Alternative check-in method

### **Technical Improvements**
- **Server-side Processing**: Real database integration
- **Advanced AI**: Machine learning for face recognition
- **Real-time Updates**: WebSocket for live updates
- **API Integration**: Third-party service connections
- **Cloud Storage**: Secure cloud-based data storage

## 📞 Support

### **Documentation**
- Complete user manual
- Technical documentation
- API reference (future)
- Troubleshooting guide

### **Contact**
- For technical issues: Check troubleshooting section
- For feature requests: Use admin panel feedback
- For emergencies: Contact system administrator

## 📄 License

MIT License - Free for commercial and personal use.

## 🏸 About JomAI

JomAI Badminton Court Booking System is designed to modernize court management with cutting-edge face recognition technology. Our system ensures secure, efficient, and user-friendly court booking experiences for players and staff alike.

**Key Benefits:**
- ✅ Secure face-based verification
- ✅ Streamlined booking process
- ✅ Comprehensive admin tools
- ✅ Real-time analytics
- ✅ Mobile-friendly design
- ✅ Dark mode support

Perfect for badminton centers, sports facilities, and recreational centers looking to modernize their booking systems with advanced technology.

---

**Version**: 2.0  
**Last Updated**: 2026  
**Compatibility**: Modern browsers with camera support
