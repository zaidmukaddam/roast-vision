import { useState } from 'react';
import { OpenAI } from 'openai';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [roast, setRoast] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [fileName, setFileName] = useState('No file chosen');
  const [isRoasting, setIsRoasting] = useState(false);

  interface RoastResponse {
    score?: string;
    oneLine?: string;
    roast?: string;
  }

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setRoast('');
    setFileName(file ? file.name : 'No file chosen');
    // Set image preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviewUrl(reader.result?.toString() ?? '');
    };
    if (file) {
      reader.readAsDataURL(file);
      console.log('File:', fileName);
    }
  };

  const parsedRoast = roast.split("<br>").reduce((acc: RoastResponse, curr) => {
    const [key, value] = curr.split(":").map((el) => el.trim());
    if (key && value) {
      acc[key as keyof RoastResponse] = value;
    }
    return acc;
  }, {});

  // Function to convert the image to Base64 and send it to the OpenAI API
  const handleRoast = async () => {
    if (selectedFile) {
      setIsRoasting(true);
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString();

        // Initialize OpenAI API
        const openai = new OpenAI({
          apiKey: process.env.REACT_APP_OPENAI_API_KEY ?? '',
          dangerouslyAllowBrowser: true,
        });

        try {
          // Call to OpenAI API (endpoint might differ based on API version)
          const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "system",
                content: "You are a hilarious and professional email roaster. You will be given an image of an email and you will have to give the score of the email out of 10, One Line Sassy feedback, and a bit harsh feedback on the email's contents. The structured output shall look like this: score:8 <br> oneLine: So clean and minimalist, it almost forgot to have a personality. <br> roast: Love the pristine vibe, but how about a splash of color to keep us awake? We're here to unlock insights, not catch Z's, fam.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: base64Image ?? '',
                    },
                  }
                ]
              }
            ],
            max_tokens: 1000,
          });

          setRoast(response.choices[0].message.content ?? '');
        } catch (error) {
          console.error('Error calling OpenAI API:', error);
        }
        setIsRoasting(false);
      };
      reader.onerror = (error) => {
        console.error('Error converting image to base64:', error);
      };
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center mx-auto sm:px-24 text-slate-200"
      style={{ backgroundImage: "url('/background.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="flex min-h-screen flex-col items-center mx-auto p-4 sm:p-24 text-slate-200">
        <h1 className="text-4xl sm:text-6xl mb-4 font-bold text-slate-100 z-10">🔥 Roast your email 🔥</h1>
        <p className="opacity-40 text-lg">Built with GPT-4 Vision</p>
        <div className="flex flex-col gap-4 w-full items-center justify-center">
          <div className="flex sm:max-w-xl flex-col items-center justify-center my-12 rounded border border-red-200/20 bg-red-400/20 sm:px-12 animate-[shadow-pulse_4s_ease-in-out_infinite] px-2 py-4 sm:py-8 backdrop-blur-2xl">
            <div className="z-10 max-w-5xl flex flex-col w-full items-center text-slate-200 gap-4 justify-between tracking-wide text-sm">
              <h3 className="w-80 font-medium text-lg text-center">Take a screenshot of your email and upload it to get roasted 🔥</h3>
              <div className="flex flex-row gap-4">
                <div className="flex">
                  <input id="file-upload" type="file" onChange={handleFileChange} className="file-upload-input" style={{ display: 'none' }} />
                  <label htmlFor="file-upload" className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded cursor-pointer">Upload screenshot</label>
                </div>
                <button
                  onClick={handleRoast}
                  className="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                  disabled={isRoasting}
                >
                  {isRoasting ? 'Roast in progress' : 'Roast it!'}
                </button>

              </div>
              {roast && (
                <div className="mt-4 p-4 bg-gray-900/75 text-white rounded shadow backdrop-blur-md border border-red-200/20">
                  <div className="text-6xl">{parsedRoast.score}/10</div>
                  <div className="italic text-xl my-2">{parsedRoast.oneLine}</div>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-base">
                    {parsedRoast.roast}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          {imagePreviewUrl && (
            <div>
              <img src={imagePreviewUrl} width={600} height={600} alt="Preview" className="rounded shadow-md" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
