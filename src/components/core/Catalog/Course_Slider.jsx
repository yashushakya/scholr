// import React, { useEffect, useState } from "react"
// // Import Swiper React components
// import { Swiper, SwiperSlide } from "swiper/react"

// import { FreeMode, Pagination } from "swiper/modules"
// // Import Swiper styles
// import "swiper/css"
// import "swiper/css/free-mode"
// import "swiper/css/pagination"
// // import "../../.."
// // Import required modules

// // import { getAllCourses } from "../../services/operations/courseDetailsAPI"
// import Course_Card from "./Course_Card"

// function Course_Slider({ Courses }) {
//   return (
//     <>
//       {Courses?.length ? (
//         <Swiper
//           slidesPerView={1}
//           spaceBetween={25}
//           loop={true}
//           modules={[FreeMode, Pagination]}
//           breakpoints={{
//             1024: {
//               slidesPerView: 3,
//             },
//           }}
//           className="max-h-[30rem] bg-[#060d1a]"
//         >
//           {Courses?.map((course, i) => (
//             <SwiperSlide key={i}>
//               <Course_Card course={course} Height={"h-[250px]"} />
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       ) : (
//         <p className="text-xl text-[#f0f9ff]">No Course Found</p>
//       )}
//     </>
//   )
// }

// export default Course_Slider

import React, { useEffect, useMemo, useState } from "react"
import Course_Card from "./Course_Card"

const COURSES_PER_PAGE = 6 // 3 columns x 2 rows on large screens

// Builds a compact page list like: 1 … 4 5 6 … 12
function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const result = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...")
    result.push(p)
  })
  return result
}

function Course_Slider({ Courses }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil((Courses?.length || 0) / COURSES_PER_PAGE)

  // Go back to page 1 if the course list changes (e.g. new category/filter)
  useEffect(() => {
    setCurrentPage(1)
  }, [Courses])

  const currentCourses = useMemo(() => {
    const start = (currentPage - 1) * COURSES_PER_PAGE
    return (Courses || []).slice(start, start + COURSES_PER_PAGE)
  }, [Courses, currentPage])

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!Courses?.length) {
    return <p className="text-xl text-[#f0f9ff]">No Course Found</p>
  }

  return (
    <div className="bg-[#060d1a]">
      {/* Courses grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentCourses.map((course, i) => (
          <Course_Card
            key={course?._id || i}
            course={course}
            Height={"h-[250px]"}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Course pagination"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-md border border-[#1e293b] px-3 py-2 text-sm text-[#f0f9ff] transition hover:bg-[#0f1b33] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-[#94a3b8]">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`h-10 w-10 rounded-md border text-sm transition ${
                  page === currentPage
                    ? "border-[#38bdf8] bg-[#38bdf8] font-semibold text-[#060d1a]"
                    : "border-[#1e293b] text-[#f0f9ff] hover:bg-[#0f1b33]"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-md border border-[#1e293b] px-3 py-2 text-sm text-[#f0f9ff] transition hover:bg-[#0f1b33] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}

export default Course_Slider