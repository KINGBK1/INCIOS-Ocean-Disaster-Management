import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_APP_PASSWORD // app-specific password
  }
});

// Calculate distance between two coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
};

// Send disaster alert email to NGOs
export const sendDisasterAlertToNGOs = async (zoneData, nearbyNGOs) => {
  const emailPromises = nearbyNGOs.map(async (ngo) => {
    const distance = calculateDistance(
      zoneData.lat,
      zoneData.lng,
      ngo.ngoDetails.coordinates.lat,
      ngo.ngoDetails.coordinates.lng
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ngo.email,
      subject: `🚨 URGENT: ${zoneData.type.toUpperCase()} ZONE ALERT - Immediate Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${zoneData.type === 'danger' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 2px solid ${zoneData.type === 'danger' ? '#dc2626' : '#f59e0b'}; }
            .alert-box { background: ${zoneData.type === 'danger' ? '#fef2f2' : '#fefbf2'}; border-left: 4px solid ${zoneData.type === 'danger' ? '#dc2626' : '#f59e0b'}; padding: 15px; margin: 15px 0; }
            .info-row { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #374151; }
            .button { display: inline-block; background: ${zoneData.type === 'danger' ? '#dc2626' : '#f59e0b'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 DISASTER ZONE ALERT</h1>
              <h2>${zoneData.type === 'danger' ? 'HIGH SEVERITY' : 'WARNING'}</h2>
            </div>
            <div class="content">
              <div class="alert-box">
                <h3>Dear ${ngo.ngoDetails.organizationName},</h3>
                <p>A ${zoneData.type} zone has been identified within your service radius. Immediate attention and potential response may be required.</p>
              </div>

              <h3>🎯 Zone Details:</h3>
              <div class="info-row">
                <span class="label">Severity Level:</span> ${zoneData.type.toUpperCase()}
              </div>
              <div class="info-row">
                <span class="label">Location:</span> ${zoneData.lat.toFixed(4)}, ${zoneData.lng.toFixed(4)}
              </div>
              <div class="info-row">
                <span class="label">Affected Radius:</span> ${Math.round(zoneData.radius)}m
              </div>
              <div class="info-row">
                <span class="label">Distance from your location:</span> ${(distance/1000).toFixed(2)} km
              </div>
              ${zoneData.label ? `
              <div class="info-row">
                <span class="label">Additional Info:</span> ${zoneData.label}
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Reported At:</span> ${new Date().toLocaleString()}
              </div>

              <h3>📋 Recommended Actions:</h3>
              <ul>
                <li>Mobilize emergency response team immediately</li>
                <li>Prepare relief supplies and equipment</li>
                <li>Coordinate with local authorities</li>
                <li>Assess volunteer availability</li>
                <li>Activate emergency communication channels</li>
                <li>Review evacuation and rescue protocols</li>
              </ul>

              <h3>📞 Emergency Contacts:</h3>
              <div class="info-row">
                <span class="label">DDMO Emergency Helpline:</span> 1077
              </div>
              <div class="info-row">
                <span class="label">National Disaster Helpline:</span> 1078
              </div>
              <div class="info-row">
                <span class="label">Platform Support:</span> support@varuna.gov.in
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL}/ngo-dashboard" class="button">
                  View Full Dashboard →
                </a>
              </center>

              <div class="footer">
                <p>This is an automated alert from VARUNA Disaster Management System</p>
                <p>Please do not reply to this email. For support, contact: support@varuna.gov.in</p>
                <p>© 2025 VARUNA - Government of India Initiative</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Alert email sent to ${ngo.ngoDetails.organizationName}`);
      return { success: true, ngoId: ngo._id };
    } catch (error) {
      console.error(`Failed to send email to ${ngo.email}:`, error);
      return { success: false, ngoId: ngo._id, error: error.message };
    }
  });

  return await Promise.allSettled(emailPromises);
};

// Send weekly digest to NGOs
export const sendWeeklyDigest = async (ngo, alertsSummary) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: ngo.email,
    subject: `📊 Weekly Disaster Alert Summary - ${ngo.ngoDetails.organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 20px; border: 1px solid #e5e7eb; }
          .stat-box { background: #f3f4f6; padding: 15px; margin: 10px 0; border-radius: 6px; display: flex; justify-content: space-between; }
          .stat-label { font-weight: bold; }
          .stat-value { font-size: 24px; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Alert Summary</h1>
            <p>Period: ${alertsSummary.startDate} to ${alertsSummary.endDate}</p>
          </div>
          <div class="content">
            <h2>Hello ${ngo.ngoDetails.organizationName},</h2>
            <p>Here's your weekly summary of disaster alerts in your service area:</p>
            
            <div class="stat-box">
              <span class="stat-label">Total Alerts:</span>
              <span class="stat-value">${alertsSummary.totalAlerts}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Danger Zones:</span>
              <span class="stat-value">${alertsSummary.dangerZones}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Warning Zones:</span>
              <span class="stat-value">${alertsSummary.warningZones}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Alerts Acknowledged:</span>
              <span class="stat-value">${alertsSummary.acknowledged}</span>
            </div>

            <p style="margin-top: 20px;">Stay prepared and keep your response teams ready.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/ngo-dashboard" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">
                View Dashboard →
              </a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Weekly digest sent to ${ngo.ngoDetails.organizationName}`);
  } catch (error) {
    console.error(`Failed to send weekly digest to ${ngo.email}:`, error);
  }
};

export default transporter;