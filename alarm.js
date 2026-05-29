sendEmailNotification(userEmail, userName, taskTitle, taskDescription, scheduledTime) {
    const formattedTime = new Date(scheduledTime).toLocaleString();
    
    // Initialize EmailJS (public key)
    emailjs.init('koAqVQ3gTxbRn-QKI');
    
    // Send email using your template
    emailjs.send('service_95zfcl8', 'template_5w0r0mg', {
        to_email: userEmail,
        to_name: userName,
        task_title: taskTitle,
        task_description: taskDescription || 'No description',
        task_time: formattedTime
    }).then(() => {
        console.log('📧 EmailJS: Notification sent to', userEmail);
        // Also store in local history for the Email History page
        if (typeof addEmail !== 'undefined') {
            addEmail({
                to: userEmail,
                subject: `⏰ Task Reminder: ${taskTitle}`,
                body: `Hello ${userName},\n\nYour task "${taskTitle}" is due at ${formattedTime}.\nDescription: ${taskDescription || 'None'}`
            });
        }
    }).catch(err => {
        console.error('❌ EmailJS error:', err);
    });
}