function doGet(request) {
  const secretKey = '';
  if (request.parameter['hub.verify_token'] == secretKey) {
    return ContentService.createTextOutput(request.parameter['hub.challenge']);
  }
}

function doPost(request) {
  const sheetName = '';
  const sheet = spreadsheet.getSheetByName(sheetName);
  const accessToken = 'Your Page Access Token';

  const data = JSON.parse(request.postData.getDataAsString());
  var entries = data.entry;

  for (var i = 0; i < entries.length; i++) {
    const entry = entries[i];
    //  this represents your sheet time. You can find it in the file => setting
    const sheetDateTime = Date();
    //  this is the utc time of lead when it comes
    var utcTime = entry.time;
    // you can use this utc time to represent your ad account time
    var adAccountDateTime = new Date(utcTime * 1000);
    //  Select the timezone of your ad account. In my case it is gmt +05
    var formatedDate = Utilities.formatDate(
      adAccountDateTime,
      'GMT+05',
      "dd-MM-yyyy 'Time' hh:mm:ss a"
    );

    // Get lead identifier
    const leadId = entry.changes[0].value.leadgen_id;
    const lead_info_endpoint = `https://graph.facebook.com/v15.0/${lead_id}?access_token=${accessToken}`;
    const leadRequest = UrlFetchApp.fetch(lead_info_endpoint);
    var leadResponse = JSON.parse(leadRequest);
    var leadData = leadResponse.field_data;

    const final_lead_information = {};

    // Compile all data in an object
    for (var x = 0; x < leadData.length; x++) {
      final_lead_information[leadData[x].name] = leadData[x].values[0];
    }
    const values = Object.values(final_lead_information);
    sheet.appendRow([sheetDateTime, adAccountDateTime, ...values]);

    // Record it in the Google Sheets

    sendMail(final_lead_information, formatedDate);
  }

  function sendMail(final_lead_information, formatedDate) {
    var receipients = 'example@google.com';
    var plain_body = '';
    var html_body =
      'You have got a new lead.<br/><br/> Created Time : ' +
      formatedDate +
      '<br/>';
    var format_order = ['full_name', 'email', 'phone_number'];

    var format_order1 = ['Full Name', 'Email', 'Phone Number'];
    for (var y = 0; y < format_order.length; y++) {
      // Plain Body Content
      if (y > 0) {
        plain_body += ' || ';
      }
      plain_body += final_lead_information[format_order[y]];

      // HTML Body Content
      var title = format_order[y];
      var modifiedTitle = format_order1[y];
      html_body +=
        modifiedTitle + ' : ' + final_lead_information[title] + '<br />';
    }

    // Send an email
    GmailApp.sendEmail(receipients, 'subject', plain_body, {
      htmlBody: html_body,
      name: 'Facebook Lead Notifier', // this is not available cause noreply is true
      noReply: true,
      replyTo: 'example@google.com',
    });
  }
}
