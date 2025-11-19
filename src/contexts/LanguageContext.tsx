import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, LanguageContextType } from '@/types/auth';

// Translation strings
const translations = {
  // Authentication
  'auth.login': { en: 'Login', nl: 'Inloggen' },
  'auth.register': { en: 'Register', nl: 'Registreren' },
  'auth.logout': { en: 'Logout', nl: 'Uitloggen' },
  'auth.email': { en: 'Email', nl: 'E-mail' },
  'auth.password': { en: 'Password', nl: 'Wachtwoord' },
  'auth.confirmPassword': { en: 'Confirm Password', nl: 'Bevestig Wachtwoord' },
  'auth.firstName': { en: 'First Name', nl: 'Voornaam' },
  'auth.lastName': { en: 'Last Name', nl: 'Achternaam' },
  'auth.phone': { en: 'Phone', nl: 'Telefoon' },
  'auth.role': { en: 'Role', nl: 'Rol' },
  'auth.forgotPassword': { en: 'Forgot Password?', nl: 'Wachtwoord Vergeten?' },
  'auth.rememberDevice': { en: 'Remember this device', nl: 'Onthoud dit apparaat' },
  'auth.twoFactorCode': { en: 'Two-Factor Code', nl: 'Twee-Factor Code' },
  'auth.backupCode': { en: 'Backup Code', nl: 'Backup Code' },
  'auth.acceptTerms': { en: 'I accept the terms and conditions', nl: 'Ik accepteer de algemene voorwaarden' },
  
  // Roles
  'role.admin': { en: 'Administrator', nl: 'Beheerder' },
  'role.therapist': { en: 'Therapist', nl: 'Therapeut' },
  'role.client': { en: 'Client', nl: 'Cliënt' },
  'role.assistant': { en: 'Assistant', nl: 'Assistent' },
  
  // Assistant Dashboard
  'assistant.dashboard.title': { en: 'Assistant Dashboard', nl: 'Assistent Dashboard' },
  'assistant.dashboard.welcome': { en: 'Manage appointments, client communications, and administrative tasks', nl: 'Beheer afspraken, cliënt communicatie en administratieve taken' },
  'assistant.dashboard.pendingTasks': { en: 'Pending Tasks', nl: 'Openstaande Taken' },
  'assistant.dashboard.todayAppointments': { en: "Today's Appointments", nl: 'Afspraken Vandaag' },
  'assistant.dashboard.clientContacts': { en: 'Client Contacts', nl: 'Cliënt Contacten' },
  'assistant.dashboard.completedTasks': { en: 'Completed Tasks', nl: 'Voltooide Taken' },
  'assistant.dashboard.taskMarkedAs': { en: 'Task marked as', nl: 'Taak gemarkeerd als' },
  'assistant.dashboard.contactStatusUpdated': { en: 'Contact status updated to', nl: 'Contact status bijgewerkt naar' },
  'assistant.dashboard.overview': { en: 'Overview', nl: 'Overzicht' },
  'assistant.dashboard.tasks': { en: 'Tasks', nl: 'Taken' },
  'assistant.dashboard.contacts': { en: 'Contacts', nl: 'Contacten' },
  'assistant.dashboard.scheduling': { en: 'Scheduling', nl: 'Planning' },
  'assistant.dashboard.urgent': { en: 'Urgent', nl: 'Urgent' },
  'assistant.dashboard.high': { en: 'High', nl: 'Hoog' },
  'assistant.dashboard.normal': { en: 'Normal', nl: 'Normaal' },
  'assistant.dashboard.low': { en: 'Low', nl: 'Laag' },
  'assistant.dashboard.pending': { en: 'Pending', nl: 'In afwachting' },
  'assistant.dashboard.inProgress': { en: 'In Progress', nl: 'In uitvoering' },
  'assistant.dashboard.completed': { en: 'Completed', nl: 'Voltooid' },
  'assistant.dashboard.contacted': { en: 'Contacted', nl: 'Gecontacteerd' },
  'assistant.dashboard.resolved': { en: 'Resolved', nl: 'Opgelost' },
  'assistant.dashboard.highPriority': { en: 'High priority', nl: 'Hoge prioriteit' },
  'assistant.dashboard.needFollowUp': { en: 'Need follow-up', nl: 'Opvolging nodig' },
  'assistant.dashboard.scheduled': { en: 'Scheduled', nl: 'Gepland' },
  'assistant.dashboard.thisWeek': { en: 'This week', nl: 'Deze week' },
  'role.bookkeeper': { en: 'Accountant', nl: 'Accountant' },
  'role.substitute': { en: 'Subtherapist', nl: 'Waarnemer' },
  
  // Navigation
  'nav.dashboard': { en: 'Dashboard', nl: 'Dashboard' },
  'nav.clients': { en: 'Clients', nl: 'Cliënten' },
  'nav.therapists': { en: 'Therapists', nl: 'Therapeuten' },
  'nav.appointments': { en: 'Appointments', nl: 'Afspraken' },
  'nav.appointmentRequests': { en: 'Appointment Requests', nl: 'Afspraak Aanvragen' },
  'nav.calendar': { en: 'Calendar', nl: 'Agenda' },
  'nav.messages': { en: 'Messages', nl: 'Berichten' },
  'nav.financial': { en: 'Financial', nl: 'Financieel' },
  'nav.reports': { en: 'Reports', nl: 'Rapporten' },
  'nav.settings': { en: 'Settings', nl: 'Instellingen' },
  'nav.profile': { en: 'Profile', nl: 'Profiel' },
  'nav.help': { en: 'Help', nl: 'Help' },
  'nav.waitingList': { en: 'Waiting List', nl: 'Wachtlijst' },
  'nav.myClients': { en: 'My Clients', nl: 'Mijn Cliënten' },
  'nav.myAppointments': { en: 'My Appointments', nl: 'Mijn Afspraken' },
  'nav.myTherapist': { en: 'My Therapist', nl: 'Mijn Therapeut' },
  'nav.resources': { en: 'Resources', nl: 'Bronnen' },
  'nav.challenges': { en: 'Challenges', nl: 'Uitdagingen' },
  'nav.surveys': { en: 'Surveys', nl: 'Enquêtes' },
  'nav.invoices': { en: 'Invoices', nl: 'Facturen' },
  'nav.payments': { en: 'Payments', nl: 'Betalingen' },
  'nav.paymentMethods': { en: 'Payment Methods', nl: 'Betaalmethoden' },
  'nav.clientSupport': { en: 'Client Support', nl: 'Cliëntondersteuning' },
  'nav.scheduling': { en: 'Scheduling', nl: 'Planning' },
  'nav.sessionNotes': { en: 'Session Notes', nl: 'Sessie Notities' },
  'nav.sessions': { en: 'Sessions', nl: 'Sessies' },
  'nav.notifications': { en: 'Notifications', nl: 'Meldingen' },
  'nav.addressChanges': { en: 'Address Changes', nl: 'Adreswijzigingen' },
  'nav.myAgenda': { en: 'My Agenda', nl: 'Mijn Agenda' },
  'nav.fullPracticeAgenda': { en: 'Full Practice Agenda', nl: 'Volledige Praktijk Agenda' },
  'nav.statusNewApplications': { en: 'Status of New Applications', nl: 'Status van Nieuwe Aanmeldingen' },
  'nav.addClient': { en: 'Add Client', nl: 'Cliënt Toevoegen' },
  'nav.allClients': { en: 'All Clients', nl: 'Alle Cliënten' },
  'nav.clientDashboardSettings': { en: 'Client Dashboard Settings', nl: 'Cliënt Dashboard Instellingen' },
  'nav.clientInvoices': { en: 'Client Invoices', nl: 'Cliënt Facturen' },
  'nav.clientAgreementForms': { en: 'Client Agreement Forms', nl: 'Cliënt Overeenkomstformulieren' },
  'nav.dashboardSettings': { en: 'Dashboard Settings', nl: 'Dashboard Instellingen' },
  'nav.statistics': { en: 'Statistics', nl: 'Statistieken' },
  'nav.statusInOutOffices': { en: 'Status of In/Out Offices', nl: 'Status van In/Uit Kantoren' },
  'nav.allTherapists': { en: 'All Therapists', nl: 'Alle Therapeuten' },
  'nav.addTherapist': { en: 'Add Therapist', nl: 'Therapeut Toevoegen' },
  'nav.therapistDashboardSettings': { en: 'Therapist Dashboard Settings', nl: 'Therapeut Dashboard Instellingen' },
  'nav.therapistInvoices': { en: 'Therapist Invoices', nl: 'Therapeut Facturen' },
  'nav.therapistContracts': { en: 'Therapist Contracts', nl: 'Therapeut Contracten' },
  'nav.totalRevenueDashboard': { en: 'Total Revenue Dashboard', nl: 'Totale Omzet Dashboard' },
  'nav.totalClientRevenue': { en: 'Total Client Revenue', nl: 'Totale Cliënt Omzet' },
  'nav.totalTherapistCost': { en: 'Total Therapist Cost', nl: 'Totale Therapeut Kosten' },
  'nav.allUnpaidInvoices': { en: 'All Unpaid Invoices', nl: 'Alle Onbetaalde Facturen' },
  'nav.invoiceSettings': { en: 'Invoice Settings', nl: 'Factuur Instellingen' },
  'nav.messageCenter': { en: 'Message Center', nl: 'Berichtencentrum' },
  'nav.myMessages': { en: 'My Messages', nl: 'Mijn Berichten' },
  'nav.fullMessages': { en: 'Full Messages', nl: 'Alle Berichten' },
  'nav.sendMessage': { en: 'Send Message', nl: 'Bericht Versturen' },
  'nav.sendEmail': { en: 'Send E-mail', nl: 'E-mail Versturen' },
  'nav.phonebook': { en: 'Phonebook', nl: 'Telefoonboek' },
  'nav.addContacts': { en: 'Add Contacts', nl: 'Contacten Toevoegen' },
  'nav.educationalResources': { en: 'Educational Resources', nl: 'Educatieve Bronnen' },
  'nav.resourceLibrary': { en: 'Resource Library', nl: 'Bronnen Bibliotheek' },
  'nav.adminCompanySettings': { en: 'Admin Company Settings', nl: 'Beheer Bedrijfsinstellingen' },
  'nav.users': { en: 'Users', nl: 'Gebruikers' },
  'nav.therapies': { en: 'Therapies', nl: 'Therapieën' },
  'nav.psychologicalProblems': { en: 'Psychological Problems', nl: 'Hulpvragen' },
  
  // Settings page translations
  'settings.profilePhoto': { en: 'Profile Photo', nl: 'Profielfoto' },
  'settings.personalInformation': { en: 'Personal Information', nl: 'Persoonlijke Informatie' },
  'settings.changeProfilePhoto': { en: 'Change Profile Photo', nl: 'Profielfoto Wijzigen' },
  'settings.uploadNewPhoto': { en: 'Upload New Photo', nl: 'Nieuwe Foto Uploaden' },
  'settings.removePhoto': { en: 'Remove Photo', nl: 'Foto Verwijderen' },
  
  // Common actions
  'action.save': { en: 'Save', nl: 'Opslaan' },
  'action.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'action.edit': { en: 'Edit', nl: 'Bewerken' },
  'action.delete': { en: 'Delete', nl: 'Verwijderen' },
  'action.view': { en: 'View', nl: 'Bekijken' },
  'action.add': { en: 'Add', nl: 'Toevoegen' },
  'action.create': { en: 'Create', nl: 'Aanmaken' },
  'action.update': { en: 'Update', nl: 'Bijwerken' },
  'action.search': { en: 'Search', nl: 'Zoeken' },
  'action.filter': { en: 'Filter', nl: 'Filteren' },
  'action.export': { en: 'Export', nl: 'Exporteren' },
  'action.import': { en: 'Import', nl: 'Importeren' },
  'action.submit': { en: 'Submit', nl: 'Verzenden' },
  'action.confirm': { en: 'Confirm', nl: 'Bevestigen' },
  'action.close': { en: 'Close', nl: 'Sluiten' },
  'action.back': { en: 'Back', nl: 'Terug' },
  'action.next': { en: 'Next', nl: 'Volgende' },
  'action.previous': { en: 'Previous', nl: 'Vorige' },
  'action.loading': { en: 'Loading...', nl: 'Laden...' },
  'action.details': { en: 'Details', nl: 'Details' },
  'action.new': { en: 'New', nl: 'Nieuw' },
  
  // CRUD operations
  'crud.searchPlaceholder': { en: 'Search...', nl: 'Zoeken...' },
  'crud.viewInfo': { en: 'View information', nl: 'Informatie bekijken' },
  'crud.updateInfo': { en: 'Update information', nl: 'Informatie bijwerken' },
  'crud.fillForm': { en: 'Fill in the form to create a new', nl: 'Vul het formulier in om een nieuwe aan te maken' },
  'crud.total': { en: 'total', nl: 'totaal' },
  
  // Common
  'common.next': { en: 'Next', nl: 'Volgende' },
  'common.previous': { en: 'Previous', nl: 'Vorige' },
  'common.backToAppointments': { en: 'Back to Appointments', nl: 'Terug naar Afspraken' },
  'common.submitting': { en: 'Submitting', nl: 'Bezig met verzenden' },
  'common.important': { en: 'Important', nl: 'Belangrijk' },
  
  // Status
  'status.active': { en: 'Active', nl: 'Actief' },
  'status.inactive': { en: 'Inactive', nl: 'Inactief' },
  'status.pending': { en: 'Pending', nl: 'In behandeling' },
  'status.suspended': { en: 'Suspended', nl: 'Geschorst' },
  'status.vacation': { en: 'Vacation', nl: 'Vakantie' },
  'status.completed': { en: 'Completed', nl: 'Voltooid' },
  'status.cancelled': { en: 'Cancelled', nl: 'Geannuleerd' },
  'status.scheduled': { en: 'Scheduled', nl: 'Gepland' },
  'status.confirmed': { en: 'Confirmed', nl: 'Bevestigd' },
  
  // Messages and notifications
  'message.success': { en: 'Operation completed successfully', nl: 'Bewerking succesvol voltooid' },
  'message.error': { en: 'An error occurred', nl: 'Er is een fout opgetreden' },
  'message.warning': { en: 'Please check the information', nl: 'Controleer de informatie' },
  'message.info': { en: 'Information', nl: 'Informatie' },
  'message.noData': { en: 'No data available', nl: 'Geen gegevens beschikbaar' },
  'message.loading': { en: 'Loading data...', nl: 'Gegevens laden...' },
  'message.confirmDelete': { en: 'Are you sure you want to delete this item?', nl: 'Weet u zeker dat u dit item wilt verwijderen?' },
  'message.unsavedChanges': { en: 'You have unsaved changes. Do you want to continue?', nl: 'U heeft niet-opgeslagen wijzigingen. Wilt u doorgaan?' },
  
  // Form validation
  'validation.required': { en: 'This field is required', nl: 'Dit veld is verplicht' },
  'validation.email': { en: 'Please enter a valid email address', nl: 'Voer een geldig e-mailadres in' },
  'validation.phone': { en: 'Please enter a valid phone number', nl: 'Voer een geldig telefoonnummer in' },
  'validation.password': { en: 'Password must be at least 8 characters', nl: 'Wachtwoord moet minimaal 8 karakters zijn' },
  'validation.passwordMatch': { en: 'Passwords do not match', nl: 'Wachtwoorden komen niet overeen' },
  'validation.minLength': { en: 'Minimum length is {0} characters', nl: 'Minimale lengte is {0} karakters' },
  'validation.maxLength': { en: 'Maximum length is {0} characters', nl: 'Maximale lengte is {0} karakters' },
  'validation.fillRequiredFields': { en: 'Please fill in all required fields', nl: 'Vul alle verplichte velden in' },
  
  // Date and time
  'date.today': { en: 'Today', nl: 'Vandaag' },
  'date.tomorrow': { en: 'Tomorrow', nl: 'Morgen' },
  'date.yesterday': { en: 'Yesterday', nl: 'Gisteren' },
  'date.thisWeek': { en: 'This Week', nl: 'Deze Week' },
  'date.nextWeek': { en: 'Next Week', nl: 'Volgende Week' },
  'date.thisMonth': { en: 'This Month', nl: 'Deze Maand' },
  'date.nextMonth': { en: 'Next Month', nl: 'Volgende Maand' },
  
  // Dashboard
  'dashboard.welcome': { en: 'Welcome back', nl: 'Welkom terug' },
  'dashboard.overview': { en: 'Overview', nl: 'Overzicht' },
  'dashboard.recentActivity': { en: 'Recent Activity', nl: 'Recente Activiteit' },
  'dashboard.upcomingAppointments': { en: 'Upcoming Appointments', nl: 'Komende Afspraken' },
  'dashboard.stats': { en: 'Statistics', nl: 'Statistieken' },
  'dashboard.nextAppointment': { en: 'Next Appointment', nl: 'Volgende Afspraak' },
  'dashboard.sessionsCompleted': { en: 'Sessions Completed', nl: 'Sessies Voltooid' },
  'dashboard.progressGoals': { en: 'Progress Goals', nl: 'Voortgang Doelen' },
  'dashboard.unreadMessages': { en: 'Unread Messages', nl: 'Ongelezen Berichten' },
  'dashboard.todayOverview': { en: "Here's your practice overview for today", nl: "Dit is uw praktijkoverzicht voor vandaag" },
  'dashboard.totalClients': { en: 'Total Clients', nl: 'Totaal Cliënten' },
  'dashboard.activeTherapists': { en: 'Active Therapists', nl: 'Actieve Therapeuten' },
  'dashboard.monthlyRevenue': { en: 'Monthly Revenue', nl: 'Maandelijkse Omzet' },
  'dashboard.pendingApprovals': { en: 'Pending Approvals', nl: 'In Afwachting van Goedkeuring' },
  'dashboard.newApplications': { en: 'New Applications', nl: 'Nieuwe Aanmeldingen' },
  'dashboard.viewAll': { en: 'View all', nl: 'Bekijk alles' },
  'dashboard.noData': { en: 'No data available', nl: 'Geen gegevens beschikbaar' },
  'dashboard.scheduleAppointment': { en: 'Schedule Appointment', nl: 'Afspraak Plannen' },
  'dashboard.yourWellnessJourney': { en: 'Your wellness journey continues here', nl: 'Uw welzijnsreis gaat hier verder' },
  'dashboard.completeIntakeForm': { en: 'Complete Your Intake Form', nl: 'Vul Uw Intakeformulier In' },
  'dashboard.intakeFormMessage': { en: 'Please complete your intake form to help your therapist understand your needs better and provide personalized care.', nl: 'Vul alstublieft uw intakeformulier in om uw therapeut te helpen uw behoeften beter te begrijpen en gepersonaliseerde zorg te bieden.' },
  'dashboard.bookAppointment': { en: 'Book Appointment', nl: 'Afspraak Boeken' },
  'dashboard.scheduleTherapySession': { en: 'Schedule your next therapy session', nl: 'Plan uw volgende therapiesessie' },
  'dashboard.messageTherapist': { en: 'Message Therapist', nl: 'Bericht Therapeut' },
  'dashboard.sendSecureMessage': { en: 'Send a secure message to your therapist', nl: 'Stuur een veilig bericht naar uw therapeut' },
  'dashboard.viewResources': { en: 'View Resources', nl: 'Bekijk Bronnen' },
  'dashboard.accessMaterials': { en: 'Access helpful materials and exercises', nl: 'Toegang tot nuttige materialen en oefeningen' },
  'dashboard.progressTracking': { en: 'Progress Tracking', nl: 'Voortgang Bijhouden' },
  'dashboard.monitorJourney': { en: 'Monitor your therapy journey', nl: 'Volg uw therapiereis' },
  'dashboard.treatmentGoals': { en: 'Treatment Goals', nl: 'Behandeldoelen' },
  'dashboard.wellnessScore': { en: 'Wellness Score', nl: 'Welzijnsscore' },
  'dashboard.resourcesCompleted': { en: 'Resources Completed', nl: 'Voltooide Bronnen' },
  'dashboard.todayWellnessTip': { en: "Today's Wellness Tip", nl: 'Welzijnstip van Vandaag' },
  'dashboard.learnMore': { en: 'Learn more', nl: 'Meer informatie' },
  'dashboard.activeClients': { en: 'Active Clients', nl: 'Actieve Cliënten' },
  'dashboard.newThisMonth': { en: 'new this month', nl: 'nieuw deze maand' },
  'dashboard.todayAppointments': { en: "Today's Appointments", nl: 'Afspraken Vandaag' },
  'dashboard.upcoming': { en: 'upcoming', nl: 'komende' },
  'dashboard.growth': { en: 'growth', nl: 'groei' },
  'dashboard.critical': { en: 'critical', nl: 'kritiek' },
  'dashboard.normal': { en: 'Normal', nl: 'Normaal' },
  'dashboard.quickActions': { en: 'Quick Actions', nl: 'Snelle Acties' },
  'dashboard.addNewClient': { en: 'Add New Client', nl: 'Nieuwe Cliënt Toevoegen' },
  'dashboard.viewSchedule': { en: 'View Schedule', nl: 'Bekijk Planning' },
  'dashboard.createInvoice': { en: 'Create Invoice', nl: 'Factuur Aanmaken' },
  'dashboard.managementModules': { en: 'Management Modules', nl: 'Beheer Modules' },
  'dashboard.clientManagementDesc': { en: 'Manage client profiles, sessions, and treatment plans', nl: 'Beheer cliëntprofielen, sessies en behandelplannen' },
  'dashboard.therapistManagementDesc': { en: 'Manage therapist profiles, schedules, and assignments', nl: 'Beheer therapeutprofielen, roosters en toewijzingen' },
  'dashboard.financialOverviewDesc': { en: 'Track revenue, invoices, and payment status', nl: 'Volg omzet, facturen en betalingsstatus' },
  'dashboard.addressChangesDesc': { en: 'Review and approve client address change requests', nl: 'Beoordeel en keur adreswijzigingsverzoeken van cliënten goed' },
  'dashboard.challengesDesc': { en: 'Create and manage therapeutic challenges', nl: 'Creëer en beheer therapeutische uitdagingen' },
  'dashboard.resourcesDesc': { en: 'Manage therapeutic resources and materials', nl: 'Beheer therapeutische bronnen en materialen' },
  'dashboard.surveysDesc': { en: 'Create and manage client feedback surveys', nl: 'Creëer en beheer cliënt feedback enquêtes' },
  'dashboard.systemSettingsDesc': { en: 'Configure practice settings and integrations', nl: 'Configureer praktijkinstellingen en integraties' },
  'dashboard.sessionsToday': { en: 'Sessions Today', nl: 'Sessies Vandaag' },
  'dashboard.outstanding': { en: 'Outstanding', nl: 'Uitstaand' },
  'dashboard.totalRequests': { en: 'Total Requests', nl: 'Totaal Aanvragen' },
  'dashboard.participants': { en: 'Participants', nl: 'Deelnemers' },
  'dashboard.assignments': { en: 'Assignments', nl: 'Toewijzingen' },
  'dashboard.activeSurveys': { en: 'Active Surveys', nl: 'Actieve Enquêtes' },
  'dashboard.responses': { en: 'Responses', nl: 'Antwoorden' },
  'dashboard.users': { en: 'Users', nl: 'Gebruikers' },
  'dashboard.integrations': { en: 'Integrations', nl: 'Integraties' },
  'dashboard.recentApplications': { en: 'Recent Applications', nl: 'Recente Aanmeldingen' },
  'dashboard.financialInsights': { en: 'Financial Insights', nl: 'Financiële Inzichten' },
  'dashboard.viewDetails': { en: 'View details', nl: 'Bekijk details' },
  'dashboard.noPendingApplications': { en: 'No pending applications', nl: 'Geen openstaande aanmeldingen' },
  'dashboard.totalRevenueMTD': { en: 'Total Revenue (MTD)', nl: 'Totale Omzet (MTD)' },
  'dashboard.outstandingAmount': { en: 'Outstanding Amount', nl: 'Uitstaand Bedrag' },
  'dashboard.paidThisMonth': { en: 'Paid This Month', nl: 'Betaald Deze Maand' },
  'dashboard.projectedRevenue': { en: 'Projected Revenue', nl: 'Verwachte Omzet' },
  'dashboard.ofProjectedRevenueAchieved': { en: 'of projected revenue achieved', nl: 'van verwachte omzet behaald' },
  'dashboard.totalActiveClientAccounts': { en: 'Total active client accounts', nl: 'Totaal actieve cliëntaccounts' },
  'dashboard.totalRevenueThisMonth': { en: 'Total revenue this month', nl: 'Totale omzet deze maand' },
  'dashboard.scheduledForToday': { en: 'Scheduled for today', nl: 'Gepland voor vandaag' },
  'dashboard.pendingApplications': { en: 'Pending applications', nl: 'Openstaande aanmeldingen' },
  'dashboard.applied': { en: 'Applied', nl: 'Aangemeld' },
  'dashboard.adminPortal': { en: 'Admin Portal', nl: 'Beheer Portaal' },
  'dashboard.thisWeek': { en: 'This Week', nl: 'Deze Week' },
  
  // Two Factor Authentication
  'twofa.twoFactorCode': { en: 'Two-Factor Code', nl: 'Twee-Factor Code' },
  
  // Client
  'client.specializations': { en: 'Specializations', nl: 'Specialisaties' },
  'client.generalTherapy': { en: 'General therapy', nl: 'Algemene therapie' },
  'client.noUpcomingAppointments': { en: 'No upcoming appointments', nl: 'Geen aankomende afspraken' },
  'client.viewAll': { en: 'View all', nl: 'Bekijk alles' },
  'client.sendMessage': { en: 'Send message', nl: 'Bericht versturen' },
  'client.noUnreadMessages': { en: 'No unread messages', nl: 'Geen ongelezen berichten' },
  'client.todayWellnessTip': { en: "Today's Wellness Tip", nl: 'Welzijnstip van Vandaag' },
  
  // Bookkeeper
  'bookkeeper.dashboardSubtitle': { en: 'Complete financial management and invoice tracking', nl: 'Compleet financiël beheer en factuurtracking' },
  'bookkeeper.paymentReminder': { en: 'Payment Reminder', nl: 'Betalingsherinnering' },
  'bookkeeper.currentPeriod': { en: 'Current Period', nl: 'Huidige Periode' },
  'bookkeeper.lastUpdated': { en: 'Last updated', nl: 'Laatst bijgewerkt' },
  'bookkeeper.vsLastMonth': { en: 'vs last month', nl: 'vs vorige maand' },
  'bookkeeper.overdue': { en: 'Overdue', nl: 'Achterstallig' },
  'bookkeeper.requireAttention': { en: 'Require attention', nl: 'Vereisen aandacht' },

  // Agenda
  'agenda.title': { en: 'Practice Agenda', nl: 'Praktijk Agenda' },
  'agenda.subtitle': { en: 'Complete overview of all practice appointments', nl: 'Compleet overzicht van alle praktijkafspraken' },
  'agenda.myAgenda': { en: 'My Agenda', nl: 'Mijn Agenda' },
  'agenda.fullPracticeAgenda': { en: 'Full Practice Agenda', nl: 'Volledige Praktijk Agenda' },
  'agenda.newAppointment': { en: 'New Appointment', nl: 'Nieuwe Afspraak' },
  'agenda.allAppointments': { en: 'All Appointments', nl: 'Alle Afspraken' },
  'agenda.noAppointments': { en: 'No appointments found', nl: 'Geen afspraken gevonden' },
  'agenda.statusLegend': { en: 'Status Legend', nl: 'Status Legenda' },
  'agenda.viewDetails': { en: 'View Details', nl: 'Details Bekijken' },

  // Clients
  'clients.title': { en: 'Client Management', nl: 'Cliëntbeheer' },
  'clients.subtitle': { en: 'Complete overview of all client profiles and information', nl: 'Compleet overzicht van alle cliëntprofielen en informatie' },
  'clients.addNewClient': { en: 'Add New Client', nl: 'Nieuwe Cliënt Toevoegen' },
  'clients.totalClients': { en: 'Total Clients', nl: 'Totaal Cliënten' },
  'clients.activeClients': { en: 'Active', nl: 'Actief' },
  'clients.newClients': { en: 'New', nl: 'Nieuw' },
  'clients.completedClients': { en: 'Completed', nl: 'Voltooid' },
  'clients.searchClients': { en: 'Search clients...', nl: 'Zoek cliënten...' },
  'clients.allStatuses': { en: 'All Statuses', nl: 'Alle Statussen' },
  'clients.allTherapists': { en: 'All Therapists', nl: 'Alle Therapeuten' },
  'clients.allInsurance': { en: 'All Insurance', nl: 'Alle Verzekeringen' },
  'clients.allLocations': { en: 'All Locations', nl: 'Alle Locaties' },
  'clients.noClientsFound': { en: 'No clients found', nl: 'Geen cliënten gevonden' },
  'clients.adjustFilters': { en: 'Try adjusting your search or filters', nl: 'Probeer uw zoekopdracht of filters aan te passen' },
  'clients.getStarted': { en: 'Get started by adding your first client', nl: 'Begin door uw eerste cliënt toe te voegen' },

  // Client Status
  'clientStatus.new': { en: 'New Registration', nl: 'Nieuwe Registratie' },
  'clientStatus.viewed': { en: 'Viewed by Practitioner', nl: 'Bekeken door Behandelaar' },
  'clientStatus.intakeScheduled': { en: 'Intake Scheduled', nl: 'Intake Gepland' },
  'clientStatus.startingTreatment': { en: 'Starting Treatment', nl: 'Start Behandeling' },
  'clientStatus.activeTreatment': { en: 'Active Treatment', nl: 'Actieve Behandeling' },
  'clientStatus.onHold': { en: 'On Hold', nl: 'In de Wacht' },

  // Payment Status
  'paymentStatus.paidOnTime': { en: 'Paid on Time', nl: 'Op Tijd Betaald' },
  'paymentStatus.paymentPlan': { en: 'Payment Plan', nl: 'Betalingsregeling' },
  'paymentStatus.nonCompliant': { en: 'Non-Compliant', nl: 'Niet-Nalevend' },
  'paymentStatus.collectionAgency': { en: 'Collection Agency', nl: 'Incassobureau' },
  'paymentStatus.legalProceedings': { en: 'Legal Proceedings', nl: 'Gerechtelijke Procedure' },
  'paymentStatus.notDue': { en: 'Not Due', nl: 'Nog Niet Verschuldigd' },
  'paymentStatus.exceptionalCircumstances': { en: 'Exceptional Circumstances', nl: 'Bijzondere Omstandigheden' },
  'paymentStatus.processing': { en: 'Processing', nl: 'In Behandeling' },

  // Therapists
  'therapists.title': { en: 'Therapist Management', nl: 'Therapeutenbeheer' },
  'therapists.subtitle': { en: 'Complete overview of all therapist profiles and information', nl: 'Compleet overzicht van alle therapeutenprofielen en informatie' },
  'therapists.addNewTherapist': { en: 'Add New Therapist', nl: 'Nieuwe Therapeut Toevoegen' },
  'therapists.totalTherapists': { en: 'Total Therapists', nl: 'Totaal Therapeuten' },
  'therapists.activeTherapists': { en: 'Active', nl: 'Actief' },
  'therapists.onVacation': { en: 'On Vacation', nl: 'Met Vakantie' },
  'therapists.agbReimbursed': { en: 'AGB Reimbursed', nl: 'AGB Vergoed' },
  'therapists.searchTherapists': { en: 'Search therapists...', nl: 'Zoek therapeuten...' },
  'therapists.noTherapistsFound': { en: 'No therapists found', nl: 'Geen therapeuten gevonden' },
  'therapists.adjustFilters': { en: 'Try adjusting your search or filters', nl: 'Probeer uw zoekopdracht of filters aan te passen' },
  'therapists.getStarted': { en: 'Get started by adding your first therapist', nl: 'Begin door uw eerste therapeut toe te voegen' },

  // Therapist Status
  'therapistStatus.agbReimbursed': { en: 'AGB Reimbursed', nl: 'AGB Vergoed' },
  'therapistStatus.basicReimbursement': { en: 'Basic Reimbursement', nl: 'Basis Vergoeding' },
  'therapistStatus.noReimbursement': { en: 'No Reimbursement', nl: 'Geen Vergoeding' },
  'therapistStatus.onVacation': { en: 'On Vacation', nl: 'Met Vakantie' },
  'therapistStatus.dayOff': { en: 'Day Off', nl: 'Vrije Dag' },

  // Financial
  'financial.title': { en: 'Financial Management', nl: 'Financieel Beheer' },
  'financial.subtitle': { en: 'Complete overview of practice finances and invoicing', nl: 'Compleet overzicht van praktijkfinanciën en facturering' },
  'financial.totalRevenue': { en: 'Total Revenue', nl: 'Totale Omzet' },
  'financial.outstandingAmount': { en: 'Outstanding Amount', nl: 'Uitstaand Bedrag' },
  'financial.therapistCosts': { en: 'Therapist Costs', nl: 'Therapeut Kosten' },
  'financial.netProfit': { en: 'Net Profit', nl: 'Netto Winst' },
  'financial.clientInvoices': { en: 'Client Invoices', nl: 'Cliënt Facturen' },
  'financial.therapistInvoices': { en: 'Therapist Invoices', nl: 'Therapeut Facturen' },
  'financial.revenueChart': { en: 'Revenue Analytics', nl: 'Omzet Analyse' },
  'financial.quickActions': { en: 'Quick Actions', nl: 'Snelle Acties' },
  'financial.generateReport': { en: 'Generate Report', nl: 'Rapport Genereren' },

  // Therapist Dashboard
  'therapist.dashboardSubtitle': { en: 'Your therapeutic practice overview', nl: 'Uw therapeutische praktijkoverzicht' },
  'therapist.myClients': { en: 'My Clients', nl: 'Mijn Cliënten' },
  'therapist.todayAppointments': { en: "Today's Appointments", nl: 'Afspraken Vandaag' },
  'therapist.weeklyHours': { en: 'Weekly Hours', nl: 'Wekelijkse Uren' },
  'therapist.unpaidInvoices': { en: 'Unpaid Invoices', nl: 'Onbetaalde Facturen' },
  'therapist.todaySchedule': { en: "Today's Schedule", nl: 'Agenda Vandaag' },
  'therapist.recentClients': { en: 'Recent Clients', nl: 'Recente Cliënten' },
  'therapist.viewFullCalendar': { en: 'View full calendar', nl: 'Volledige agenda bekijken' },
  'therapist.viewAllClients': { en: 'View all clients', nl: 'Alle cliënten bekijken' },
  'therapist.quickActions': { en: 'Quick Actions', nl: 'Snelle Acties' },
  'therapist.scheduleAppointment': { en: 'Schedule Appointment', nl: 'Afspraak Inplannen' },
  'therapist.addSessionNotes': { en: 'Add Session Notes', nl: 'Sessie Notities Toevoegen' },
  'therapist.viewClientDetails': { en: 'View Client Details', nl: 'Cliënt Details Bekijken' },
  'therapist.sendMessage': { en: 'Send Message', nl: 'Bericht Versturen' },
  'therapist.nextWeekPreview': { en: 'Next Week Preview', nl: 'Volgende Week Vooruitblik' },
  'therapist.monthlyRevenue': { en: 'Monthly Revenue', nl: 'Maandelijkse Omzet' },
  'therapist.myCalendar': { en: 'My Calendar', nl: 'Mijn Agenda' },
  'therapist.calendarSubtitle': { en: 'Manage your appointments and schedule', nl: 'Beheer uw afspraken en planning' },
  'therapist.newAppointment': { en: 'New Appointment', nl: 'Nieuwe Afspraak' },
  'therapist.allAppointments': { en: 'All Appointments', nl: 'Alle Afspraken' },
  'therapist.noAppointmentsToday': { en: 'No appointments scheduled for today', nl: 'Geen afspraken gepland voor vandaag' },

  // Appointments
  'appointments.bookAppointment': { en: 'Book an Appointment', nl: 'Afspraak Boeken' },
  'appointments.requestNewSession': { en: 'Request a new therapy session', nl: 'Nieuwe therapiesessie aanvragen' },
  'appointments.selectDateTime': { en: 'Select Date & Time', nl: 'Selecteer Datum & Tijd' },
  'appointments.preferredDate': { en: 'Preferred Date', nl: 'Voorkeursdatum' },
  'appointments.preferredTime': { en: 'Preferred Time', nl: 'Voorkeurstijd' },
  'appointments.therapyType': { en: 'Therapy Type', nl: 'Type Therapie' },
  'appointments.urgencyLevel': { en: 'Urgency Level', nl: 'Urgentieniveau' },
  'appointments.normal': { en: 'Normal', nl: 'Normaal' },
  'appointments.urgent': { en: 'Urgent', nl: 'Urgent' },
  'appointments.regularAppointment': { en: 'Regular appointment', nl: 'Reguliere afspraak' },
  'appointments.needHelpSoon': { en: 'Need help soon', nl: 'Snel hulp nodig' },
  'appointments.selectTherapist': { en: 'Select Therapist', nl: 'Selecteer Therapeut' },
  'appointments.yourTherapist': { en: 'Your Therapist', nl: 'Uw Therapeut' },
  'appointments.chooseAnother': { en: 'Choose Another', nl: 'Kies een Andere' },
  'appointments.searchTherapists': { en: 'Search therapists...', nl: 'Zoek therapeuten...' },
  'appointments.languages': { en: 'Languages', nl: 'Talen' },
  'appointments.onlineAvailable': { en: 'Online Available', nl: 'Online Beschikbaar' },
  'appointments.noTherapistsAvailable': { en: 'No therapists available', nl: 'Geen therapeuten beschikbaar' },
  'appointments.backToAssigned': { en: 'Back to assigned therapist', nl: 'Terug naar toegewezen therapeut' },
  'appointments.describeYourNeeds': { en: 'Describe Your Needs', nl: 'Beschrijf Uw Behoeften' },
  'appointments.whatToDiscuss': { en: 'What would you like to discuss?', nl: 'Wat wilt u bespreken?' },
  'appointments.descriptionPlaceholder': { en: "Please describe what you'd like to work on in this session...", nl: 'Beschrijf waar u aan wilt werken in deze sessie...' },
  'appointments.helpsTherapistPrepare': { en: 'This helps your therapist prepare for your session', nl: 'Dit helpt uw therapeut zich voor te bereiden op uw sessie' },
  'appointments.privacyImportant': { en: 'Your privacy is important', nl: 'Uw privacy is belangrijk' },
  'appointments.confidentialInfo': { en: 'All information shared is confidential and will only be seen by your therapist.', nl: 'Alle gedeelde informatie is vertrouwelijk en wordt alleen gezien door uw therapeut.' },
  'appointments.reviewRequest': { en: 'Review Your Request', nl: 'Controleer Uw Aanvraag' },
  'appointments.date': { en: 'Date', nl: 'Datum' },
  'appointments.time': { en: 'Time', nl: 'Tijd' },
  'appointments.urgency': { en: 'Urgency', nl: 'Urgentie' },
  'appointments.therapist': { en: 'Therapist', nl: 'Therapeut' },
  'appointments.description': { en: 'Description', nl: 'Beschrijving' },
  'appointments.requestReviewNotice': { en: "Your appointment request will be reviewed and you'll receive a confirmation within 24 hours.", nl: 'Uw afspraakverzoek wordt beoordeeld en u ontvangt binnen 24 uur een bevestiging.' },
  'appointments.submitRequest': { en: 'Submit Request', nl: 'Aanvraag Verzenden' },
  'appointments.bookingRestricted': { en: 'Booking Restricted', nl: 'Boeken Beperkt' },
  'appointments.cannotBookExceedsLimit': { en: 'You cannot book new appointments because your unpaid invoice balance exceeds €300.', nl: 'U kunt geen nieuwe afspraken boeken omdat uw onbetaalde factuursaldo meer dan €300 bedraagt.' },
  'appointments.outstandingBalance': { en: 'Outstanding balance', nl: 'Uitstaand saldo' },
  'appointments.payToContineBooking': { en: 'Please pay your outstanding invoices to continue booking appointments.', nl: 'Betaal uw openstaande facturen om door te gaan met het boeken van afspraken.' },
  'appointments.viewUnpaidInvoices': { en: 'View Unpaid Invoices', nl: 'Bekijk Onbetaalde Facturen' },
  'appointments.makePayment': { en: 'Make Payment', nl: 'Betaling Doen' },
  'appointments.dateTime': { en: 'Date & Time', nl: 'Datum & Tijd' },
  'appointments.review': { en: 'Review', nl: 'Controleren' },
  'appointments.requestSubmittedSuccess': { en: 'Appointment request submitted successfully! You will be notified once it is confirmed.', nl: 'Afspraakverzoek succesvol ingediend! U wordt op de hoogte gebracht zodra het is bevestigd.' },
  'appointments.requestSubmitError': { en: 'Failed to submit appointment request. Please try again.', nl: 'Kan afspraakverzoek niet indienen. Probeer het opnieuw.' },
  'appointments.selectDateTimeError': { en: 'Please select both date and time', nl: 'Selecteer zowel datum als tijd' },
  'appointments.describeNeeds': { en: 'Please describe what you would like to discuss', nl: 'Beschrijf wat u wilt bespreken' },
  'appointments.additionalInfo': { en: 'Additional Information', nl: 'Aanvullende Informatie' },
  'appointments.additionalDetailsPlaceholder': { en: 'Add any additional details that might help your therapist prepare for the session...', nl: 'Voeg eventuele aanvullende details toe die uw therapeut kunnen helpen bij de voorbereiding van de sessie...' },
  'appointments.optionalAdditionalInfo': { en: 'This is optional but can help provide additional context beyond your selected concerns.', nl: 'Dit is optioneel maar kan helpen om extra context te geven naast uw geselecteerde hulpvragen.' },
  'appointments.optional': { en: 'optional', nl: 'optioneel' },
  'appointments.autoMatch': { en: 'Auto Match', nl: 'Automatisch Matchen' },
  'appointments.autoMatchDescription': { en: 'Let our system automatically match you with the best therapist based on your concerns', nl: 'Laat ons systeem u automatisch matchen met de beste therapeut op basis van uw hulpvragen' },
  'appointments.autoMatchSelected': { en: 'Auto-matching enabled - We will find the best therapist for you', nl: 'Automatisch matchen ingeschakeld - Wij vinden de beste therapeut voor u' },

  // Therapist
  'therapist.browseOtherTherapists': { en: 'Browse Other Therapists', nl: 'Bekijk Andere Therapeuten' },
  'therapist.loadError': { en: 'Failed to load therapist information', nl: 'Kan therapeutinformatie niet laden' },
  
  // Therapists List
  'therapists.profileViewComingSoon': { en: 'Profile view coming soon', nl: 'Profielweergave komt binnenkort' },
  'therapists.viewNotAvailable': { en: 'Therapist Directory Not Available', nl: 'Therapeutenoverzicht Niet Beschikbaar' },
  'therapists.contactForInfo': { en: 'This feature requires backend implementation. Please contact your therapist for information about other practitioners.', nl: 'Deze functie vereist backend-implementatie. Neem contact op met uw therapeut voor informatie over andere behandelaars.' },
  'nav.viewYourTherapist': { en: 'View Your Therapist', nl: 'Bekijk Uw Therapeut' },
  
  // Therapist Messages
  'therapist.messages': { en: 'Messages', nl: 'Berichten' },
  'therapist.messagesSubtitle': { en: 'Communicate securely with clients and practice staff', nl: 'Communiceer veilig met cliënten en praktijkpersoneel' },
  'therapist.composeMessage': { en: 'Compose Message', nl: 'Nieuw Bericht' },
  'therapist.unreadMessages': { en: 'Unread Messages', nl: 'Ongelezen Berichten' },
  'therapist.clientConversations': { en: 'Client Conversations', nl: 'Cliënt Gesprekken' },
  'therapist.highPriorityMessages': { en: 'High Priority', nl: 'Hoge Prioriteit' },
  'therapist.practiceMessages': { en: 'Practice Messages', nl: 'Praktijk Berichten' },
  'therapist.searchMessages': { en: 'Search messages...', nl: 'Zoek berichten...' },
  'therapist.noMessagesFound': { en: 'No messages found', nl: 'Geen berichten gevonden' },
  'therapist.selectConversation': { en: 'Select a conversation', nl: 'Selecteer een gesprek' },
  'therapist.selectConversationSubtitle': { en: 'Choose a conversation to start messaging', nl: 'Kies een gesprek om te beginnen met berichten' },
  'therapist.typeMessage': { en: 'Type your message...', nl: 'Typ uw bericht...' },

  // Sessions
  'sessions.title': { en: 'Session Management', nl: 'Sessiebeheer' },
  'sessions.subtitle': { en: 'Manage and track your therapy sessions', nl: 'Beheer en volg uw therapiesessies' },
  
  // 2FA
  'twofa.setup': { en: 'Setup Two-Factor Authentication', nl: 'Twee-Factor Authenticatie Instellen' },
  'twofa.verify': { en: 'Verify Two-Factor Authentication', nl: 'Twee-Factor Authenticatie Verifiëren' },
  'twofa.disable': { en: 'Disable Two-Factor Authentication', nl: 'Twee-Factor Authenticatie Uitschakelen' },
  'twofa.scanQR': { en: 'Scan the QR code with your authenticator app', nl: 'Scan de QR-code met uw authenticator-app' },
  'twofa.enterCode': { en: 'Enter the 6-digit code from your authenticator app', nl: 'Voer de 6-cijferige code in van uw authenticator-app' },
  'twofa.backupCodes': { en: 'Backup Codes', nl: 'Backup Codes' },
  'twofa.saveBackupCodes': { en: 'Save these backup codes in a safe place', nl: 'Bewaar deze backup codes op een veilige plaats' },
  'twofa.saveBackupCodesTitle': { en: 'Save Your Backup Codes', nl: 'Bewaar Uw Backup Codes' },
  'twofa.completeSetup': { en: 'Complete Setup & Continue', nl: 'Setup Voltooien & Doorgaan' },
  'twofa.step1': { en: 'Step 1: Scan QR Code', nl: 'Stap 1: Scan QR Code' },
  'twofa.step2': { en: 'Step 2:', nl: 'Stap 2:' },
  'twofa.qrFailed': { en: 'QR code failed to load', nl: 'QR code laden mislukt' },
  'twofa.verifyEnable': { en: 'Verify and Enable 2FA', nl: 'Verifiëren en 2FA Inschakelen' },
  'twofa.useBackupCode': { en: 'Use backup code instead', nl: 'Gebruik backup code' },
  'twofa.useAuthenticator': { en: 'Use authenticator app instead', nl: 'Gebruik authenticator app' },
  'twofa.verifyCode': { en: 'Verify Code', nl: 'Code Verifiëren' },
  'twofa.verifyBackupCode': { en: 'Verify Backup Code', nl: 'Backup Code Verifiëren' },
  'twofa.welcomeBack': { en: 'Welcome Back', nl: 'Welkom Terug' },
  'twofa.signInAccount': { en: 'Sign in to your PraktijkEPD account', nl: 'Log in op uw PraktijkEPD account' },
  'twofa.emailAddress': { en: 'Email Address', nl: 'E-mailadres' },
  'twofa.password': { en: 'Password', nl: 'Wachtwoord' },
  'twofa.rememberDevice': { en: 'Remember this device', nl: 'Onthoud dit apparaat' },
  'twofa.forgotPassword': { en: 'Forgot your password?', nl: 'Wachtwoord vergeten?' },
  'twofa.createAccount': { en: 'Create Account', nl: 'Account Aanmaken' },
  'twofa.alreadyAccount': { en: "Don't have an account?", nl: 'Heeft u nog geen account?' },
  'twofa.signIn': { en: 'Sign In', nl: 'Inloggen' },
  'twofa.signing': { en: 'Signing in...', nl: 'Bezig met inloggen...' },
  'twofa.preferredLanguage': { en: 'Preferred Language', nl: 'Voorkeurstaal' },
  'twofa.createAccountSubtitle': { en: 'Create your PraktijkEPD account', nl: 'Maak uw PraktijkEPD account aan' },
  
  // Company info
  'company.name': { en: 'PraktijkEPD', nl: 'PraktijkEPD' },
  'company.description': { en: 'Therapy Practice Management', nl: 'Praktijk Management Systeem' },
  'company.copyright': { en: 'All rights reserved', nl: 'Alle rechten voorbehouden' },
  
  // Language selection
  'language.en': { en: 'English', nl: 'Engels' },
  'language.nl': { en: 'Dutch', nl: 'Nederlands' },
  'language.select': { en: 'Select Language', nl: 'Selecteer Taal' },
  
  // Theme
  'theme.light': { en: 'Light', nl: 'Licht' },
  'theme.dark': { en: 'Dark', nl: 'Donker' },
  'theme.system': { en: 'System', nl: 'Systeem' },
  
  // Accessibility
  'accessibility.menu': { en: 'Main menu', nl: 'Hoofdmenu' },
  'accessibility.skipToContent': { en: 'Skip to main content', nl: 'Ga naar hoofdinhoud' },
  'accessibility.closeDialog': { en: 'Close dialog', nl: 'Dialoog sluiten' },
  'accessibility.openMenu': { en: 'Open menu', nl: 'Menu openen' },
  'accessibility.loading': { en: 'Loading', nl: 'Laden' },
  
  // Challenges
  'challenges.filters': { en: 'Filters', nl: 'Filters' },
  'challenges.showFilters': { en: 'Show Filters', nl: 'Toon Filters' },
  'challenges.hideFilters': { en: 'Hide Filters', nl: 'Verberg Filters' },
  'challenges.category': { en: 'Category', nl: 'Categorie' },
  'challenges.difficulty': { en: 'Difficulty', nl: 'Moeilijkheidsgraad' },
  'challenges.dateRange': { en: 'Date Range', nl: 'Datumbereik' },
  'challenges.allCategories': { en: 'All Categories', nl: 'Alle Categorieën' },
  'challenges.allDifficulties': { en: 'All Difficulties', nl: 'Alle Moeilijkheidsgraden' },
  'challenges.allTime': { en: 'All Time', nl: 'Alle Tijd' },
  'challenges.lastWeek': { en: 'Last Week', nl: 'Afgelopen Week' },
  'challenges.lastMonth': { en: 'Last Month', nl: 'Afgelopen Maand' },
  'challenges.lastQuarter': { en: 'Last Quarter', nl: 'Afgelopen Kwartaal' },
  'challenges.activeFilters': { en: 'Active filters:', nl: 'Actieve filters:' },
  'challenges.clearAll': { en: 'Clear all', nl: 'Alles wissen' },
  'challenges.alreadyCompletedToday': { en: 'You have already completed this challenge today', nl: 'Je hebt deze uitdaging vandaag al voltooid' },
  
  // Therapists
  'therapists.allTherapists': { en: 'All Therapists', nl: 'Alle Therapeuten' },
  'therapists.findAndBook': { en: 'Find and book appointments with our experienced therapists', nl: 'Vind en boek afspraken met onze ervaren therapeuten' },
  'therapists.search': { en: 'Search by name, specialization, or keyword...', nl: 'Zoek op naam, specialisatie of trefwoord...' },
  'therapists.specialization': { en: 'Specialization', nl: 'Specialisatie' },
  'therapists.language': { en: 'Language', nl: 'Taal' },
  'therapists.availability': { en: 'Availability', nl: 'Beschikbaarheid' },
  'therapists.available': { en: 'Available', nl: 'Beschikbaar' },
  'therapists.busy': { en: 'Busy', nl: 'Bezet' },
  'therapists.acceptsInsurance': { en: 'Accepts Insurance', nl: 'Accepteert Verzekering' },
  'therapists.onlineTherapy': { en: 'Online Therapy', nl: 'Online Therapie' },
  'therapists.yearsExperience': { en: '{years} years experience', nl: '{years} jaar ervaring' },
  'therapists.reviews': { en: 'reviews', nl: 'beoordelingen' },
  'therapists.bookSession': { en: 'Book Session', nl: 'Sessie Boeken' },
  'therapists.viewProfile': { en: 'View Profile', nl: 'Profiel Bekijken' },
  'therapists.adjustSearch': { en: 'Try adjusting your search criteria or filters to find therapists.', nl: 'Probeer uw zoekcriteria of filters aan te passen om therapeuten te vinden.' },
  'therapists.browseOther': { en: 'Browse Other Therapists', nl: 'Andere Therapeuten Bekijken' },
  'therapists.insurance': { en: 'Insurance', nl: 'Verzekering' },
  'therapists.online': { en: 'Online', nl: 'Online' },
  'therapists.all': { en: 'All', nl: 'Alle' },
  'therapists.yes': { en: 'Yes', nl: 'Ja' },
  'therapists.no': { en: 'No', nl: 'Nee' },
  'therapists.notAvailable': { en: 'Not Available', nl: 'Niet Beschikbaar' },
  'therapists.showing': { en: 'Showing {count} of {total} therapists', nl: 'Toont {count} van {total} therapeuten' },
  
  // Invoices
  'invoices.viewInvoice': { en: 'Invoice', nl: 'Factuur' },
  'invoices.issuedOn': { en: 'Issued on', nl: 'Uitgegeven op' },
  'invoices.print': { en: 'Print', nl: 'Afdrukken' },
  'invoices.downloadPDF': { en: 'Download PDF', nl: 'Download PDF' },
  'invoices.practiceInfo': { en: 'Practice Information', nl: 'Praktijkinformatie' },
  'invoices.billTo': { en: 'Bill To', nl: 'Factuur Aan' },
  'invoices.invoiceDate': { en: 'Invoice Date', nl: 'Factuurdatum' },
  'invoices.dueDate': { en: 'Due Date', nl: 'Vervaldatum' },
  'invoices.therapist': { en: 'Therapist', nl: 'Therapeut' },
  'invoices.sessionDate': { en: 'Session Date', nl: 'Sessiedatum' },
  'invoices.services': { en: 'Services', nl: 'Diensten' },
  'invoices.description': { en: 'Description', nl: 'Omschrijving' },
  'invoices.quantity': { en: 'Quantity', nl: 'Aantal' },
  'invoices.rate': { en: 'Rate', nl: 'Tarief' },
  'invoices.amount': { en: 'Amount', nl: 'Bedrag' },
  'invoices.subtotal': { en: 'Subtotal', nl: 'Subtotaal' },
  'invoices.total': { en: 'Total', nl: 'Totaal' },
  'invoices.paymentInfo': { en: 'Payment Information', nl: 'Betalingsinformatie' },
  'invoices.transferTo': { en: 'Please transfer the amount to:', nl: 'Gelieve het bedrag over te maken naar:' },
  'invoices.bank': { en: 'Bank', nl: 'Bank' },
  'invoices.reference': { en: 'Reference', nl: 'Referentie' },
  'invoices.notes': { en: 'Notes', nl: 'Opmerkingen' },
  'invoices.unpaidInvoices': { en: 'Unpaid Invoices', nl: 'Onbetaalde Facturen' },
  'invoices.overdueInvoices': { en: 'Overdue Invoices', nl: 'Achterstallige Facturen' },
  'invoices.youHave': { en: 'You have', nl: 'U heeft' },
  'invoices.unpaidInvoice': { en: 'unpaid invoice', nl: 'onbetaalde factuur' },
  'invoices.totalOutstanding': { en: 'Total Outstanding', nl: 'Totaal Openstaand' },
  'invoices.overdue': { en: 'overdue', nl: 'achterstallig' },
  'invoices.due': { en: 'Due:', nl: 'Vervalt:' },
  'invoices.andMore': { en: '... and {count} more', nl: '... en nog {count} meer' },
  'invoices.bookingRestriction': { en: 'Booking Restriction', nl: 'Boekingsbeperking' },
  'invoices.cannotBook': { en: 'You cannot book new appointments until your outstanding balance is below €300.', nl: 'U kunt geen nieuwe afspraken boeken totdat uw openstaande saldo onder de €300 is.' },
  'invoices.actionRequired': { en: 'Action Required', nl: 'Actie Vereist' },
  'invoices.payImmediately': { en: 'You have invoices over 30 days old. Please pay these immediately to avoid service interruption.', nl: 'U heeft facturen ouder dan 30 dagen. Betaal deze onmiddellijk om onderbreking van de dienstverlening te voorkomen.' },
  'invoices.viewAllInvoices': { en: 'View All Invoices', nl: 'Bekijk Alle Facturen' },
  'invoices.payNow': { en: 'Pay Now', nl: 'Nu Betalen' },
  'invoices.bookingRestricted': { en: 'Booking Restricted', nl: 'Boeking Beperkt' },
  'invoices.outstandingBalance': { en: 'Outstanding balance:', nl: 'Openstaand saldo:' },
  'invoices.payToontinue': { en: 'Please pay your outstanding invoices to continue booking appointments.', nl: 'Betaal uw openstaande facturen om door te gaan met het boeken van afspraken.' },
  'invoices.makePayment': { en: 'Make Payment', nl: 'Betaling Uitvoeren' },
  
  // Error messages
  'errors.failedToLoadHulpvragen': { en: 'Failed to load help questions', nl: 'Kan hulpvragen niet laden' },
  
  // Common UI elements
  'ui.search': { en: 'Search', nl: 'Zoeken' },
  'ui.filters': { en: 'Filters', nl: 'Filters' },
  'ui.showMore': { en: 'Show More', nl: 'Meer Tonen' },
  'ui.showLess': { en: 'Show Less', nl: 'Minder Tonen' },
  'ui.noResults': { en: 'No results found', nl: 'Geen resultaten gevonden' },
  'ui.loading': { en: 'Loading...', nl: 'Laden...' },
  'ui.error': { en: 'An error occurred', nl: 'Er is een fout opgetreden' },
  'ui.tryAgain': { en: 'Try Again', nl: 'Probeer Opnieuw' },
  'ui.refresh': { en: 'Refresh', nl: 'Vernieuwen' },
  'ui.goBack': { en: 'Go Back', nl: 'Ga Terug' },
  
  // Profile Photo
  'profile.photo.alt': { en: 'Profile photo', nl: 'Profielfoto' },
  'profile.photo.upload': { en: 'Upload Photo', nl: 'Foto Uploaden' },
  'profile.photo.delete': { en: 'Delete', nl: 'Verwijderen' },
  'profile.photo.invalidType': { en: 'Please select a valid image file (JPG, PNG, or WebP)', nl: 'Selecteer een geldig afbeeldingsbestand (JPG, PNG of WebP)' },
  'profile.photo.tooLarge': { en: 'Image must be less than 5MB', nl: 'Afbeelding moet kleiner zijn dan 5MB' },
  'profile.photo.uploadSuccess': { en: 'Profile photo updated successfully', nl: 'Profielfoto succesvol bijgewerkt' },
  'profile.photo.uploadError': { en: 'Failed to upload photo', nl: 'Foto uploaden mislukt' },
  'profile.photo.deleteSuccess': { en: 'Profile photo deleted successfully', nl: 'Profielfoto succesvol verwijderd' },
  'profile.photo.deleteError': { en: 'Failed to delete photo', nl: 'Foto verwijderen mislukt' },
  'profile.photo.deleteConfirm': { en: 'Are you sure you want to delete your profile photo?', nl: 'Weet u zeker dat u uw profielfoto wilt verwijderen?' },
  'profile.photo.helpText': { en: 'Upload a professional photo. Images will be automatically cropped to a square. Maximum file size: 5MB.', nl: 'Upload een professionele foto. Afbeeldingen worden automatisch bijgesneden tot een vierkant. Maximale bestandsgrootte: 5MB.' },
} as const;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Get language from localStorage or user preference
    const stored = localStorage.getItem('language') as LanguageCode;
    if (stored && [LanguageCode.EN, LanguageCode.NL].includes(stored)) {
      return stored;
    }
    
    // Get from environment or default to English
    const defaultLang = import.meta.env.VITE_DEFAULT_LANGUAGE as LanguageCode;
    return defaultLang || LanguageCode.EN;
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update meta tags if needed
    const metaLang = document.querySelector('meta[name="language"]');
    if (metaLang) {
      metaLang.setAttribute('content', lang);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key as keyof typeof translations];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    let text: string = translation[language] || translation.en;
    
    // Replace parameters in format {0}, {1}, etc. or {param}
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{${param}}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper hook for translations
export const useTranslation = () => {
  const { t, language } = useLanguage();
  return { t, language };
};

// Component for language switcher
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`language-switcher ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
        aria-label={t('language.select')}
      >
        <option value={LanguageCode.EN}>🇺🇸 {t('language.en')}</option>
        <option value={LanguageCode.NL}>🇳🇱 {t('language.nl')}</option>
      </select>
    </div>
  );
};

// Helper function to get role translation
export const getRoleTranslation = (role: string, language: LanguageCode): string => {
  const roleKey = `role.${role.toLowerCase()}`;
  const translation = translations[roleKey as keyof typeof translations];
  return translation ? translation[language] : role;
};

// Helper function to get status translation
export const getStatusTranslation = (status: string, language: LanguageCode): string => {
  const statusKey = `status.${status.toLowerCase()}`;
  const translation = translations[statusKey as keyof typeof translations];
  return translation ? translation[language] : status;
};

// Export translation keys for TypeScript support
export type TranslationKey = keyof typeof translations;