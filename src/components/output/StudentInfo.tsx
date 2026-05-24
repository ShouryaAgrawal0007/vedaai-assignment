import React, { useState, useEffect } from 'react';

interface StudentInfoProps {
  grade?: string;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ grade = '8th' }) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 my-6 text-xs font-bold text-zinc-800 select-text print:my-4 print:gap-2 print:text-black">
      
      {/* Name row */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap select-none">Name:</span>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isPrinting ? "___________________________" : "Enter student name"}
          className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-[#FF5722] text-xs font-extrabold text-zinc-950 placeholder-zinc-400 rounded-xl px-3 py-1.5 focus:outline-none w-72 transition-all print:bg-transparent print:border-none print:px-0 print:py-0 print:placeholder-zinc-400 print:text-black print:w-64"
        />
      </div>

      {/* Roll number row */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap select-none">Roll Number:</span>
        <input 
          type="text" 
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder={isPrinting ? "___________________________" : "Enter roll number"}
          className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-[#FF5722] text-xs font-extrabold text-zinc-950 placeholder-zinc-400 rounded-xl px-3 py-1.5 focus:outline-none w-72 transition-all print:bg-transparent print:border-none print:px-0 print:py-0 print:placeholder-zinc-400 print:text-black print:w-64"
        />
      </div>

      {/* Class Section row */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap select-none">Class: {grade} &nbsp;&nbsp; Section:</span>
        <input 
          type="text" 
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder={isPrinting ? "___________" : "e.g. A"}
          className="bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-[#FF5722] text-xs font-extrabold text-zinc-950 placeholder-zinc-400 rounded-xl px-3 py-1.5 focus:outline-none w-28 transition-all print:bg-transparent print:border-none print:px-0 print:py-0 print:placeholder-zinc-400 print:text-black print:w-24"
        />
      </div>

    </div>
  );
};
