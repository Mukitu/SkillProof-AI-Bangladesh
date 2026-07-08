const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add new state variables
const stateHookTarget = "  const [bioInput, setBioInput] = useState(user?.bio || user?.socialLinks?.bio || '');";
const newStateHooks = `  const [bioInput, setBioInput] = useState(user?.bio || user?.socialLinks?.bio || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || user?.socialLinks?.username || '');
  const [dobInput, setDobInput] = useState(user?.dob || user?.socialLinks?.dob || '');
  const [genderInput, setGenderInput] = useState(user?.gender || user?.socialLinks?.gender || '');
  const [countryInput, setCountryInput] = useState(user?.country || user?.socialLinks?.country || '');
  const [cityInput, setCityInput] = useState(user?.city || user?.socialLinks?.city || '');`;

content = content.replace(stateHookTarget, newStateHooks);

// 2. Update handleProfileSave
const saveTarget = `    const res = await updateProfile({
      fullName: fullNameInput,
      phone: phoneInput,
      education: educationInput,
      experience: experienceInput,
      skills: skillsArray,
      socialLinks: {
        github: githubInput,
        linkedin: linkedinInput,
        address: addressInput,
        university: universityInput,
        department: departmentInput,
        portfolio: portfolioInput
      }
    });`;

const newSaveContent = `    setSaveStatus('saving');
    const res = await updateProfile({
      fullName: fullNameInput,
      phone: phoneInput,
      education: educationInput,
      experience: experienceInput,
      skills: skillsArray,
      address: addressInput,
      university: universityInput,
      department: departmentInput,
      semester: semesterInput,
      github: githubInput,
      linkedin: linkedinInput,
      portfolio: portfolioInput,
      bio: bioInput,
      username: usernameInput,
      dob: dobInput,
      gender: genderInput,
      country: countryInput,
      city: cityInput
    });
    setSaveStatus(res.success ? 'saved' : 'error');`;

content = content.replace(saveTarget, newSaveContent);

// 3. Update ProfileTab props
const profileTabPropsTarget = `                  calculateProfileCompletion={calculateProfileCompletion}`;
const newProfileTabProps = `                  usernameInput={usernameInput}
                  setUsernameInput={setUsernameInput}
                  dobInput={dobInput}
                  setDobInput={setDobInput}
                  genderInput={genderInput}
                  setGenderInput={setGenderInput}
                  countryInput={countryInput}
                  setCountryInput={setCountryInput}
                  cityInput={cityInput}
                  setCityInput={setCityInput}
                  onSave={async () => {
                    await handleProfileSave({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  savingProfile={saveStatus === 'saving'}
                  calculateProfileCompletion={calculateProfileCompletion}`;

content = content.replace(profileTabPropsTarget, newProfileTabProps);

fs.writeFileSync('src/components/Dashboard.tsx', content);
