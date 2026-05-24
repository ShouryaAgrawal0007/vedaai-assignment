import React, { useState } from 'react';

interface StudentInfoProps {
  grade?: string;
}

export const StudentInfo: React.FC<StudentInfoProps> = ({ grade = '5th' }) => {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');

  return (
    <div className="flex flex-col gap-2.5 my-6 text-xs font-bold text-zinc-800 select-text print:my-4 print:gap-1.5 print:text-black">
      
      {/* Name row */}
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap">Name:</span>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="___________________________"
          className="bg-transparent border-none text-xs font-extrabold text-zinc-950 placeholder-zinc-300 focus:outline-none w-64 print:placeholder-zinc-400 print:text-black"
        />
      </div>

      {/* Roll number row */}
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap">Roll Number:</span>
        <input 
          type="text" 
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="___________________________"
          className="bg-transparent border-none text-xs font-extrabold text-zinc-950 placeholder-zinc-300 focus:outline-none w-64 print:placeholder-zinc-400 print:text-black"
        />
      </div>

      {/* Class Section row */}
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap">Class: {grade} Section:</span>
        <input 
          type="text" 
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="___________"
          className="bg-transparent border-none text-xs font-extrabold text-zinc-950 placeholder-zinc-300 focus:outline-none w-24 print:placeholder-zinc-400 print:text-black"
        />
      </div>

    </div>
  );
};
