# Gabay sa Backend Files

Gabay ito para madaling maipaliwanag sa presentation ang mga bahagi ng backend ng Dental Clinic app.

## Paano dumadaan ang isang request

```text
Frontend → Route → Validation/Middleware → Controller → Model/Database → Response
```

- **Route** ang tumatanggap ng URL at nagdidirekta sa tamang function.
- **Middleware** ang nagsusuri ng request o access bago ito makarating sa controller.
- **Controller** ang nagpapatupad ng pangunahing proseso at naghahanda ng response.
- **Model** ang nagtatakda ng anyo at rules ng data sa database.

## Pangunahing files

### Server at database

| File | Purpose |
|---|---|
| `server.js` | Entry point ng backend. Nagsisimula ng Express server, nagkokonekta sa database, at nagrerehistro ng API routes at middleware. |
| `config/db.js` | Kumokonekta sa MongoDB. |

### Models (`models/`)

Ang models ang nagtatakda ng structure at rules ng data na ise-save sa MongoDB.

| File | Purpose |
|---|---|
| `User.js` | Account data, role, password hashing at password/OTP comparison. |
| `Patient.js` | Patient profile data. |
| `Dentist.js` | Dentist profile data. |
| `Appointment.js` | Appointment data. |
| `DentalService.js` | Mga dental service ng clinic. |
| `ClosedDate.js` | Mga petsang sarado ang clinic. |
| `ClinicalNote.js` | Clinical notes para sa patient records. |

### Routes (`routes/`)

Ang routes ang nagmamapa ng API URL at HTTP method papunta sa validation at controller.

| File | Purpose |
|---|---|
| `authRoutes.js` | Register, login, OTP verification, resend OTP, at sariling profile. |
| `appointmentRoutes.js` | Mga endpoint para sa appointments. |
| `patientRoutes.js` | Mga endpoint para sa patient data. |
| `dentistRoutes.js` | Mga endpoint para sa dentist data. |
| `dentalServiceRoutes.js` | Mga endpoint para sa dental services. |
| `closedDateRoutes.js` | Mga endpoint para sa closed dates. |
| `recordsRoutes.js` | Mga endpoint para sa patient records at clinical notes. |
| `adminRoutes.js` | Mga endpoint para sa admin operations. |

### Controllers (`controllers/`)

Ang controllers ang may pangunahing logic ng request: kumukuha o nagbabago ng data sa pamamagitan ng models at nagpapadala ng response.

| File | Purpose |
|---|---|
| `authController.js` | Registration, pag-check ng password, pagpapadala at pag-verify ng OTP, at pag-isyu ng login token. |
| `appointmentController.js` | Proseso para sa appointments. |
| `patientController.js` | Proseso para sa patient data. |
| `dentistController.js` | Proseso para sa dentist data. |
| `dentalServiceController.js` | Proseso para sa dental services. |
| `closedDateController.js` | Proseso para sa clinic closed dates. |
| `recordsController.js` | Proseso para sa patient records at clinical notes. |
| `adminController.js` | Admin operations. |
| `accountsController.js` | Account management operations. |
| `staffController.js` | Staff management operations. |

### Middleware (`middleware/`)

Middleware ang mga function na tumatakbo habang pinoproseso ang request—karaniwan bago ang controller.

| File | Purpose |
|---|---|
| `authMiddleware.js` | Nagche-check ng token at access para sa protected endpoints. |
| `validate.js` | Tinitingnan kung may validation errors at ibinabalik ang mga ito bago tumakbo ang controller. |
| `errorHandler.js` | Nagbibigay ng iisang format ng error response para sa backend. |

#### Validators (`middleware/validators/`)

Mga validation rule ito para sa fields na ipinapadala ng frontend.

| File | Purpose |
|---|---|
| `authValidators.js` | Rules para sa registration, login, at OTP fields. |
| `patientValidators.js` | Rules para sa patient data. |
| `dentistValidators.js` | Rules para sa dentist data. |
| `dentalServiceValidators.js` | Rules para sa dental service data. |
| `appointmentValidators.js` | Rules para sa appointment data. |

### Utilities (`utils/`)

Mga reusable helper at setup script ang laman ng folder na ito.

| File | Purpose |
|---|---|
| `generateToken.js` | Gumagawa ng JWT pagkatapos ng matagumpay na verification. |
| `generateOTP.js` | Gumagawa ng one-time verification code. |
| `sendEmail.js` | Nagpapadala ng email gaya ng login OTP. |
| `asyncHandler.js` | Nagpapasa ng errors mula sa async controller papunta sa error handler. |
| `clinicSchedule.js` | Helper para sa clinic schedule logic. |
| `seedStaff.js` | Script para maglagay ng paunang staff account/data. |
| `resetOwner.js` | Script para i-reset ang owner/admin account. |

## Halimbawa: login flow

1. Sa `server.js`, ikinakabit ang `authRoutes.js` sa `/api/auth`.
2. Sa `authRoutes.js`, ang `POST /login` ay dumadaan sa `loginValidation`, `validate`, at `login` controller.
3. Sinusuri ng `authValidators.js` at `validate.js` ang request fields.
4. Sa `authController.js`, hinahanap ang user at ikinukumpara ang password gamit ang `User.js`.
5. Kapag tama ang password, gumagawa at nag-e-email ng OTP. Sa puntong ito, hindi pa tapos ang login at wala pang token na ibinabalik.
6. Ipinapasa ang OTP sa `POST /verify-otp`. Kapag tama, gumagawa ang `generateToken.js` ng token at ibinabalik ito sa frontend.

**Maikling paliwanag para sa presentation:** “Ang route ang tumatanggap at nagdidirekta ng request, ang middleware ang nagsusuri nito, ang controller ang nagpapatakbo ng proseso, at ang model ang kumakatawan sa data sa database.”

