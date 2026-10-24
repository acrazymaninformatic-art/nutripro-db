-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetTokenHash" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "passwordResetRequestedAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "patientId" TEXT,
    "image" TEXT,
    "licenseNumber" TEXT,
    "clinicName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "sessionRevokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "sex" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "objective" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "notes" TEXT,
    "allergies" TEXT NOT NULL DEFAULT '',
    "allergiesStatus" TEXT NOT NULL DEFAULT 'NO_CONSTA',
    "intolerances" TEXT NOT NULL DEFAULT '',
    "intolerancesStatus" TEXT NOT NULL DEFAULT 'NO_CONSTA',
    "dietaryPreferences" TEXT NOT NULL DEFAULT '',
    "referralSource" TEXT,
    "medicalHistory" TEXT NOT NULL DEFAULT '',
    "pathologiesStatus" TEXT NOT NULL DEFAULT 'NO_CONSTA',
    "currentMedications" TEXT NOT NULL DEFAULT '',
    "medicationsStatus" TEXT NOT NULL DEFAULT 'NO_CONSTA',
    "supplements" TEXT NOT NULL DEFAULT '',
    "surgeries" TEXT NOT NULL DEFAULT '',
    "familyHistory" TEXT NOT NULL DEFAULT '',
    "digestiveIssues" TEXT NOT NULL DEFAULT '',
    "bowelFrequency" TEXT,
    "foodAversions" TEXT NOT NULL DEFAULT '',
    "waterIntakeLiters" DOUBLE PRECISION,
    "caffeineDaily" INTEGER,
    "alcoholFrequency" TEXT,
    "smoking" BOOLEAN NOT NULL DEFAULT false,
    "occupation" TEXT,
    "workSchedule" TEXT,
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" TEXT,
    "stressLevel" TEXT,
    "mealSchedule" TEXT NOT NULL DEFAULT '',
    "mealsPerDay" INTEGER,
    "eatsOut" TEXT,
    "cooksAtHome" BOOLEAN NOT NULL DEFAULT true,
    "exerciseType" TEXT NOT NULL DEFAULT '',
    "exerciseFrequency" INTEGER,
    "exerciseDuration" INTEGER,
    "exerciseTime" TEXT,
    "sportGoals" TEXT NOT NULL DEFAULT '',
    "trainingExperience" TEXT,
    "menstrualCycle" TEXT,
    "pregnant" BOOLEAN NOT NULL DEFAULT false,
    "breastfeeding" BOOLEAN NOT NULL DEFAULT false,
    "contraceptive" TEXT,
    "hormoneTherapy" BOOLEAN NOT NULL DEFAULT false,
    "shortTermGoal" TEXT,
    "longTermGoal" TEXT,
    "motivation" TEXT,
    "previousDiets" TEXT NOT NULL DEFAULT '',
    "dietDuration" TEXT,
    "consultationFrequency" TEXT,
    "budgetLevel" TEXT,
    "additionalNotes" TEXT,
    "targetWeightKg" DOUBLE PRECISION,
    "targetWeightDate" TIMESTAMP(3),
    "weeklyChangeTargetKg" DOUBLE PRECISION,
    "tags" TEXT NOT NULL DEFAULT '',
    "medicationSchedule" TEXT NOT NULL DEFAULT '',
    "milestonesMessage" TEXT,
    "isDischarged" BOOLEAN NOT NULL DEFAULT false,
    "dischargedAt" TIMESTAMP(3),
    "dischargeSummary" TEXT,
    "isGLP1Treatment" BOOLEAN NOT NULL DEFAULT false,
    "isTCAProtocol" BOOLEAN NOT NULL DEFAULT false,
    "anamnesisStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "anamnesisSentAt" TIMESTAMP(3),
    "anamnesisCompletedAt" TIMESTAMP(3),
    "anamnesisAccessTokenHash" TEXT,
    "anamnesisAccessTokenExpiresAt" TIMESTAMP(3),
    "consentAcceptedAt" TIMESTAMP(3),
    "consentPolicyVersion" TEXT,
    "consentRevokedAt" TIMESTAMP(3),
    "consentRevocationReason" TEXT,
    "guardianName" TEXT,
    "guardianRelationship" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "guardianConsentAt" TIMESTAMP(3),
    "guardianConsentPolicyVersion" TEXT,
    "guardianConsentMethod" TEXT,
    "portalAccessEnabled" BOOLEAN NOT NULL DEFAULT true,
    "portalLastLoginAt" TIMESTAMP(3),
    "isHardDeleted" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireDeliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "consentDeliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "declaredWeightKg" DOUBLE PRECISION,
    "declaredHeightCm" DOUBLE PRECISION,
    "fieldProvenanceJson" TEXT,
    "pendingReviewFieldsCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnamnesisSubmission" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declaredName" TEXT,
    "declaredPhone" TEXT,
    "declaredEmail" TEXT,
    "declaredBirthDate" TIMESTAMP(3),
    "declaredGender" TEXT,
    "foodPreferences" TEXT,
    "foodAversions" TEXT,
    "mealsPerDay" INTEGER,
    "mealScheduleNotes" TEXT,
    "waterIntakeLiters" DOUBLE PRECISION,
    "otherBeverages" TEXT,
    "recall24h" TEXT,
    "weekendHabits" TEXT,
    "digestiveIssues" TEXT,
    "digestiveSymptoms" TEXT,
    "medicalHistory" TEXT,
    "currentMedications" TEXT,
    "isGLP1Treatment" BOOLEAN NOT NULL DEFAULT false,
    "intolerancesOrAllergies" TEXT,
    "exerciseRoutine" TEXT,
    "sleepAndStress" TEXT,
    "emotionalEatingNotes" TEXT,
    "previousDietsExp" TEXT,
    "supplementsNotes" TEXT,
    "shortTermGoal" TEXT,
    "privacyNoticeVersion" TEXT,
    "privacyNoticeAcceptedAt" TIMESTAMP(3),
    "healthDataConsentVersion" TEXT,
    "healthDataConsentAt" TIMESTAMP(3),
    "submissionIpAddress" TEXT,
    "submissionUserAgent" TEXT,

    CONSTRAINT "AnamnesisSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodAnalysis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "glucoseMgDl" DOUBLE PRECISION,
    "hba1cPct" DOUBLE PRECISION,
    "cholesterolMgDl" DOUBLE PRECISION,
    "hdlMgDl" DOUBLE PRECISION,
    "ldlMgDl" DOUBLE PRECISION,
    "triglyceridesMgDl" DOUBLE PRECISION,
    "ferritinNgMl" DOUBLE PRECISION,
    "tshUiuMl" DOUBLE PRECISION,
    "vitaminDNgMl" DOUBLE PRECISION,
    "creatinineMgDl" DOUBLE PRECISION,
    "uricAcidMgDl" DOUBLE PRECISION,
    "gotAstUL" DOUBLE PRECISION,
    "gptAltUL" DOUBLE PRECISION,
    "insulinUiuMl" DOUBLE PRECISION,
    "plateletsKUl" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloodAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anthropometry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "bodyFatPct" DOUBLE PRECISION,
    "muscleMassKg" DOUBLE PRECISION,
    "visceralFat" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "armCm" DOUBLE PRECISION,
    "thighCm" DOUBLE PRECISION,
    "skinfoldTriceps" DOUBLE PRECISION,
    "skinfoldSubscapular" DOUBLE PRECISION,
    "skinfoldSuprailiac" DOUBLE PRECISION,
    "skinfoldAbdominal" DOUBLE PRECISION,
    "skinfoldBiceps" DOUBLE PRECISION,
    "skinfoldCalf" DOUBLE PRECISION,
    "boneDiameterWrist" DOUBLE PRECISION,
    "boneDiameterFemur" DOUBLE PRECISION,
    "boneDiameterHumerus" DOUBLE PRECISION,
    "somatotypeEndo" DOUBLE PRECISION,
    "somatotypeMeso" DOUBLE PRECISION,
    "somatotypeEcto" DOUBLE PRECISION,
    "waistToHeightRatio" DOUBLE PRECISION,
    "cunBaeFatPct" DOUBLE PRECISION,
    "phaseAngle" DOUBLE PRECISION,
    "notes" TEXT,
    "isPublishedToPatient" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anthropometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "subjectiveNotes" TEXT,
    "objectiveNotes" TEXT,
    "assessmentNotes" TEXT,
    "planNotes" TEXT,
    "attachments" TEXT,
    "clinicianSignature" TEXT,
    "patientSummary" TEXT,
    "isSharedWithPatient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalCheckIn" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adherencePct" INTEGER NOT NULL,
    "digestionScore" INTEGER,
    "habitsScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "modality" TEXT NOT NULL DEFAULT 'ONLINE',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "appointmentType" TEXT NOT NULL DEFAULT 'REVISION',
    "typeColor" TEXT NOT NULL DEFAULT '#16a34a',
    "location" TEXT DEFAULT 'Consulta Nutricional Eva Vidal',
    "notes" TEXT,
    "meetUrl" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" TIMESTAMP(3),
    "rescheduleTokenHash" TEXT,
    "rescheduleTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "preferredFrom" TIMESTAMP(3),
    "preferredTo" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT,
    "number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "fdcId" INTEGER,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT NOT NULL DEFAULT 'custom',
    "imageUrl" TEXT,
    "servingSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugarG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saturatedFatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monounsaturatedFatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "polyunsaturatedFatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cholesterolMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "potassiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calciumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ironMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminAUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminCMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminDUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminEMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminKUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB1Mg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB2Mg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB3Mg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB6Mg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vitaminB12Ug" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "folateUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "magnesiumMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zincMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "phosphorusMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seleniumUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iodineUg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "omega3G" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "addedSugarsG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solubleFiberG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insolubleFiberG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "glycemicIndex" DOUBLE PRECISION,
    "glycemicLoad" DOUBLE PRECISION,
    "fodmapCategory" TEXT,
    "purinesMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oxalatesMg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nutriScore" TEXT,
    "novaGroup" INTEGER,
    "householdMeasuresJson" TEXT NOT NULL DEFAULT '[]',
    "cookedConversionFactor" DOUBLE PRECISION,
    "ediblePartPercentage" DOUBLE PRECISION DEFAULT 100,
    "allergensJson" TEXT NOT NULL DEFAULT '[]',
    "dietaryTagsJson" TEXT NOT NULL DEFAULT '[]',
    "barcode" TEXT,
    "brandName" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'BEDCA',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "isSupplement" BOOLEAN NOT NULL DEFAULT false,
    "supplementDose" TEXT,
    "seasonMonthsJson" TEXT NOT NULL DEFAULT '[]',
    "pricePerKg" DOUBLE PRECISION,
    "carbonFootprintKgCo2" DOUBLE PRECISION,
    "waterFootprintLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "servings" INTEGER NOT NULL,
    "prepTimeMin" INTEGER,
    "cookTimeMin" INTEGER,
    "instructions" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "dietaryTagsJson" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'FACIL',
    "estimatedCost" DOUBLE PRECISION,
    "equipmentJson" TEXT NOT NULL DEFAULT '[]',
    "isBatchCooking" BOOLEAN NOT NULL DEFAULT false,
    "isFreezable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "foodId" INTEGER NOT NULL,
    "quantityG" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "targetKcal" DOUBLE PRECISION NOT NULL,
    "targetProteinG" DOUBLE PRECISION NOT NULL,
    "targetCarbsG" DOUBLE PRECISION NOT NULL,
    "targetFatG" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "hideCaloriesTCA" BOOLEAN NOT NULL DEFAULT false,
    "isGLP1" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "publishedBy" TEXT,
    "checklistPassed" BOOLEAN NOT NULL DEFAULT true,
    "clinicalChecklistNotes" TEXT,
    "isSharedWithPatient" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "planningModel" TEXT NOT NULL DEFAULT 'TRADITIONAL',
    "currentPhase" TEXT,
    "autoTransitionDate" TIMESTAMP(3),
    "targetKcalRest" DOUBLE PRECISION,
    "targetCarbsGRest" DOUBLE PRECISION,
    "targetProteinGRest" DOUBLE PRECISION,
    "targetFatGRest" DOUBLE PRECISION,
    "targetKcalMin" DOUBLE PRECISION,
    "targetKcalMax" DOUBLE PRECISION,
    "targetProteinGMin" DOUBLE PRECISION,
    "targetProteinGMax" DOUBLE PRECISION,
    "hydrationTargetLiters" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "supplementationPlanJson" TEXT NOT NULL DEFAULT '[]',
    "eatingOutGuide" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "firstOpenedByPatientAt" TIMESTAMP(3),
    "digitalSignatureHash" TEXT,
    "batchCookingGuideJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayPlan" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "customName" TEXT,
    "date" TIMESTAMP(3),

    CONSTRAINT "DayPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "dayPlanId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isOptionB" BOOLEAN NOT NULL DEFAULT false,
    "optionGroup" TEXT,
    "isCheatMeal" BOOLEAN NOT NULL DEFAULT false,
    "timingType" TEXT NOT NULL DEFAULT 'REGULAR',

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodId" INTEGER,
    "recipeId" TEXT,
    "quantityG" DOUBLE PRECISION NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "exchangeServings" DOUBLE PRECISION,
    "exchangeGroup" TEXT,
    "portionMeasureName" TEXT,
    "portionMeasureGrams" DOUBLE PRECISION,
    "isAlternative" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "MealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "acceptedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDocument" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeKb" INTEGER,
    "mimeType" TEXT,
    "isSharedWithPatient" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "patientId" TEXT,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorDetails" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyLockdown" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "activatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyLockdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalScreening" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION,
    "resultCategory" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientQuestionnaire" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'ALTA',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "draftAnswersJson" TEXT,
    "answersJson" TEXT,
    "attachmentsJson" TEXT,
    "redFlagsJson" TEXT,
    "pendingFieldsCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedFieldsCount" INTEGER NOT NULL DEFAULT 0,
    "isReopened" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'NEW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "appointmentType" TEXT NOT NULL DEFAULT 'REVISION',
    "modality" TEXT NOT NULL DEFAULT 'ONLINE',
    "preferredTimeOfDay" TEXT,
    "preferredDays" TEXT,
    "reason" TEXT,
    "patientNotes" TEXT,
    "proposedDate" TIMESTAMP(3),
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaBlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'OTRO',
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsorptionInteractionRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "nutrientTarget" TEXT NOT NULL,
    "inhibitorKeywordsJson" TEXT NOT NULL,
    "enhancerKeywordsJson" TEXT NOT NULL,
    "recommendationMessage" TEXT NOT NULL,
    "suggestedAdjustment" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsorptionInteractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodDuplicateMergeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryFoodId" INTEGER NOT NULL,
    "mergedFoodId" INTEGER NOT NULL,
    "primaryFoodName" TEXT NOT NULL,
    "mergedFoodName" TEXT NOT NULL,
    "mergedRecipeItemsCount" INTEGER NOT NULL DEFAULT 0,
    "mergedMealItemsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodDuplicateMergeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalProtocolRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase" TEXT,
    "parametersJson" TEXT NOT NULL DEFAULT '{}',
    "symptomLogJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalProtocolRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculatorResultRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "bmrKcal" DOUBLE PRECISION NOT NULL,
    "tdeeKcal" DOUBLE PRECISION NOT NULL,
    "activityFactor" DOUBLE PRECISION NOT NULL,
    "specialNeedsJson" TEXT,
    "stepsOrMetsJson" TEXT,
    "weightPredictionJson" TEXT,
    "cardiovascularRiskJson" TEXT,
    "micronutrientDriJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalculatorResultRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "internalNotes" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateSourceId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "settingsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuConfigVersion" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuPatientAssignment" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "profileJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuPatientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_patientId_key" ON "User"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_anamnesisAccessTokenHash_key" ON "Patient"("anamnesisAccessTokenHash");

-- CreateIndex
CREATE INDEX "Patient_userId_idx" ON "Patient"("userId");

-- CreateIndex
CREATE INDEX "AnamnesisSubmission_patientId_idx" ON "AnamnesisSubmission"("patientId");

-- CreateIndex
CREATE INDEX "BloodAnalysis_patientId_idx" ON "BloodAnalysis"("patientId");

-- CreateIndex
CREATE INDEX "Anthropometry_patientId_idx" ON "Anthropometry"("patientId");

-- CreateIndex
CREATE INDEX "Consultation_patientId_idx" ON "Consultation"("patientId");

-- CreateIndex
CREATE INDEX "ClinicalCheckIn_patientId_date_idx" ON "ClinicalCheckIn"("patientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_rescheduleTokenHash_key" ON "Appointment"("rescheduleTokenHash");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_status_idx" ON "WaitlistEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "WaitlistEntry_patientId_idx" ON "WaitlistEntry"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_userId_status_idx" ON "Invoice"("userId", "status");

-- CreateIndex
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_userId_status_idx" ON "DataSubjectRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_patientId_idx" ON "DataSubjectRequest"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_patientId_idx" ON "AuditLog"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Food_fdcId_key" ON "Food"("fdcId");

-- CreateIndex
CREATE UNIQUE INDEX "Food_barcode_key" ON "Food"("barcode");

-- CreateIndex
CREATE INDEX "Food_userId_idx" ON "Food"("userId");

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Recipe_userId_idx" ON "Recipe"("userId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_foodId_idx" ON "RecipeIngredient"("foodId");

-- CreateIndex
CREATE INDEX "MealPlan_patientId_idx" ON "MealPlan"("patientId");

-- CreateIndex
CREATE INDEX "MealPlan_userId_idx" ON "MealPlan"("userId");

-- CreateIndex
CREATE INDEX "DayPlan_mealPlanId_idx" ON "DayPlan"("mealPlanId");

-- CreateIndex
CREATE INDEX "Meal_dayPlanId_idx" ON "Meal"("dayPlanId");

-- CreateIndex
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");

-- CreateIndex
CREATE INDEX "MealItem_foodId_idx" ON "MealItem"("foodId");

-- CreateIndex
CREATE INDEX "MealItem_recipeId_idx" ON "MealItem"("recipeId");

-- CreateIndex
CREATE INDEX "PatientConsent_patientId_idx" ON "PatientConsent"("patientId");

-- CreateIndex
CREATE INDEX "PatientDocument_patientId_idx" ON "PatientDocument"("patientId");

-- CreateIndex
CREATE INDEX "EmailLog_patientId_idx" ON "EmailLog"("patientId");

-- CreateIndex
CREATE INDEX "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

-- CreateIndex
CREATE INDEX "ClinicalScreening_patientId_type_idx" ON "ClinicalScreening"("patientId", "type");

-- CreateIndex
CREATE INDEX "ProgressPhoto_patientId_idx" ON "ProgressPhoto"("patientId");

-- CreateIndex
CREATE INDEX "QuestionnaireTemplate_userId_idx" ON "QuestionnaireTemplate"("userId");

-- CreateIndex
CREATE INDEX "PatientQuestionnaire_patientId_status_idx" ON "PatientQuestionnaire"("patientId", "status");

-- CreateIndex
CREATE INDEX "AppointmentRequest_patientId_status_idx" ON "AppointmentRequest"("patientId", "status");

-- CreateIndex
CREATE INDEX "AgendaBlock_userId_startDateTime_idx" ON "AgendaBlock"("userId", "startDateTime");

-- CreateIndex
CREATE INDEX "AbsorptionInteractionRule_userId_nutrientTarget_idx" ON "AbsorptionInteractionRule"("userId", "nutrientTarget");

-- CreateIndex
CREATE INDEX "FoodDuplicateMergeLog_userId_idx" ON "FoodDuplicateMergeLog"("userId");

-- CreateIndex
CREATE INDEX "ClinicalProtocolRecord_patientId_type_idx" ON "ClinicalProtocolRecord"("patientId", "type");

-- CreateIndex
CREATE INDEX "CalculatorResultRecord_patientId_createdAt_idx" ON "CalculatorResultRecord"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MenuConfig_mealPlanId_key" ON "MenuConfig"("mealPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuConfig_internalCode_key" ON "MenuConfig"("internalCode");

-- CreateIndex
CREATE INDEX "MenuConfig_userId_idx" ON "MenuConfig"("userId");

-- CreateIndex
CREATE INDEX "MenuConfig_status_idx" ON "MenuConfig"("status");

-- CreateIndex
CREATE INDEX "MenuConfigVersion_menuId_createdAt_idx" ON "MenuConfigVersion"("menuId", "createdAt");

-- CreateIndex
CREATE INDEX "MenuPatientAssignment_patientId_idx" ON "MenuPatientAssignment"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuPatientAssignment_menuId_patientId_key" ON "MenuPatientAssignment"("menuId", "patientId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnamnesisSubmission" ADD CONSTRAINT "AnamnesisSubmission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodAnalysis" ADD CONSTRAINT "BloodAnalysis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anthropometry" ADD CONSTRAINT "Anthropometry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalCheckIn" ADD CONSTRAINT "ClinicalCheckIn_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayPlan" ADD CONSTRAINT "DayPlan_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_dayPlanId_fkey" FOREIGN KEY ("dayPlanId") REFERENCES "DayPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealItem" ADD CONSTRAINT "MealItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientConsent" ADD CONSTRAINT "PatientConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDocument" ADD CONSTRAINT "PatientDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalScreening" ADD CONSTRAINT "ClinicalScreening_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireTemplate" ADD CONSTRAINT "QuestionnaireTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientQuestionnaire" ADD CONSTRAINT "PatientQuestionnaire_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientQuestionnaire" ADD CONSTRAINT "PatientQuestionnaire_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestionnaireTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaBlock" ADD CONSTRAINT "AgendaBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionInteractionRule" ADD CONSTRAINT "AbsorptionInteractionRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodDuplicateMergeLog" ADD CONSTRAINT "FoodDuplicateMergeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalProtocolRecord" ADD CONSTRAINT "ClinicalProtocolRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculatorResultRecord" ADD CONSTRAINT "CalculatorResultRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuConfig" ADD CONSTRAINT "MenuConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuConfig" ADD CONSTRAINT "MenuConfig_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuConfigVersion" ADD CONSTRAINT "MenuConfigVersion_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPatientAssignment" ADD CONSTRAINT "MenuPatientAssignment_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuPatientAssignment" ADD CONSTRAINT "MenuPatientAssignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

