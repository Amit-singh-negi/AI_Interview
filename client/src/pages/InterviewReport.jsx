import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ServerURL } from '../App'
import Step3Report from '../components/Step3Report'

function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      setError("")
      try {
        const result = await axios.get(
          ServerURL + "/api/interview/report/" + id,
          { withCredentials: true },
        )
        setReport(result.data)
      } catch (err) {
        console.log(err)
        setError(
          err.response?.data?.message || "Failed to load this report.",
        )
      }
    }
    fetchReport()
  }, [id])

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500 text-lg'>{error}</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-500 text-lg'>Loading Report...</p>
      </div>
    )
  }

  return <Step3Report report={report} />
}

export default InterviewReport
