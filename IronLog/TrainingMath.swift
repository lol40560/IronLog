import Foundation

func epley1RM(weight: Double, reps: Int) -> Double {
    guard weight > 0, reps > 0 else { return 0 }
    if reps == 1 { return (weight * 10).rounded() / 10 }
    return (weight * (1 + Double(reps) / 30)).rounded(to: 0.1)
}

func warmupPlan(workingWeight: Double) -> [(pct: Int, reps: Int, weight: Double)] {
    guard workingWeight > 0 else { return [] }
    let steps: [(Double, Int)] = [(0.4, 8), (0.6, 5), (0.75, 3), (0.9, 1)]
    return steps.map { (pct, reps) in
        let w = (workingWeight * pct).rounded(toNearest: 2.5)
        return (pct: Int((pct * 100).rounded()), reps: reps, weight: w)
    }
}

let BAR_WEIGHTS: [String: Double] = ["Barbell": 20, "EZ Bar": 10, "Machine": 0]
let DEFAULT_PLATES: [Double] = [25, 20, 15, 10, 5, 2.5, 1.25]

struct PlateCount { let plate: Double; let count: Int }

func platesFor(target: Double, barWeight: Double, inventory: [Double]? = nil) -> (perSide: [PlateCount], leftover: Double, valid: Bool) {
    let perSide = (target - barWeight) / 2
    guard perSide > 0 else { return ([], 0, target >= barWeight) }
    var remaining = perSide
    var result: [PlateCount] = []
    let plates = (inventory?.isEmpty == false ? inventory! : DEFAULT_PLATES).sorted(by: >)
    for p in plates {
        let count = Int(floor(remaining / p))
        if count > 0 {
            result.append(PlateCount(plate: p, count: count))
            remaining = (remaining - Double(count) * p).rounded(to: 0.01)
        }
    }
    return (result, max(0, remaining), true)
}

func setVolume(_ s: WorkoutSet) -> Double {
    guard s.completed, s.type == .normal else { return 0 }
    return (s.weight ?? 0) * Double(s.reps ?? 0)
}

func workoutVolume(_ w: Workout) -> Double {
    w.exercises.reduce(0) { t, ex in
        t + ex.sets.reduce(0) { a, s in a + setVolume(s) }
    }
}

func formatClock(_ totalSeconds: Int) -> String {
    let s = max(0, totalSeconds)
    let m = s / 60
    let r = s % 60
    return String(format: "%02d:%02d", m, r)
}

// --- Pro: Gym context & Assisted mechanics ---
let FREE_WEIGHT_EQUIPMENT = ["barbell", "dumbbell", "bodyweight"]

func isFreeWeight(_ equipment: String) -> Bool {
    FREE_WEIGHT_EQUIPMENT.contains(equipment.lowercased())
}

func inGym(_ workout: Workout, gymProfileId: UUID?) -> Bool {
    guard let id = gymProfileId else { return true }
    return workout.gymProfileId == id
}

func effectiveLoad(bodyweight: Double, counterweight: Double) -> Double {
    return max(0, bodyweight - counterweight)
}

// --- Dynamic %1RM & Auto-Progression ---

func latest1RM(history: [Workout], exerciseName: String) -> Double {
    var maxVal: Double = 0
    for w in history {
        for ex in w.exercises where ex.exerciseName == exerciseName {
            for s in ex.sets where s.completed && s.type == .normal {
                let rm = epley1RM(weight: s.weight ?? 0, reps: s.reps ?? 0)
                maxVal = max(maxVal, rm)
            }
        }
    }
    return (maxVal * 10).rounded() / 10
}

func roundToPlate(_ weight: Double, step: Double = 2.5) -> Double {
    return (weight / step).rounded() * step
}

func pickWeek(periodization: Periodization?, priorCount: Int) -> (index: Int, week: PeriodizationWeek) {
    guard let p = periodization, p.enabled, !p.weeks.isEmpty else {
        return (0, PeriodizationWeek(weightPct: 100, repsFactor: 1))
    }
    let idx = min(priorCount, p.weeks.count - 1)
    return (idx, p.weeks[idx])
}

func buildWorkoutExercises(routineExercises: [RoutineExercise], history: [Workout], priorCount: Int, periodization: Periodization?) -> (weekIndex: Int, exercises: [WorkoutExercise]) {
    let (weekIndex, week) = pickWeek(periodization: periodization, priorCount: priorCount)
    let repsFactor = week.repsFactor
    let weightPctFactor = Double(week.weightPct) / 100.0

    let exercises: [WorkoutExercise] = routineExercises.map { e in
        let oneRm = (e.loadType == .percent1RM) ? latest1RM(history: history, exerciseName: e.exerciseName) : 0
        let reps = max(1, Int(round(Double(e.targetReps) * repsFactor)))

        var loadNote = ""
        if e.loadType == .percent1RM, let pct = e.weightPercent {
            if oneRm > 0 {
                let wkText = weightPctFactor != 1 ? " · wk \(weekIndex + 1): \(Int(round(weightPctFactor * 100)))%" : ""
                loadNote = "\(pct)% of \(oneRm) kg 1RM\(wkText)"
            } else {
                loadNote = "\(pct)% 1RM — log a max set first"
            }
        } else if e.loadType == .targetWeight, let target = e.targetWeight, weightPctFactor != 1 {
            loadNote = "\(Int(round(weightPctFactor * 100)))% of target"
        }

        let sets: [WorkoutSet] = (0..<(e.targetSets)).map { _ in
            var weight: Double?
            switch e.loadType {
            case .percent1RM:
                if let pct = e.weightPercent, oneRm > 0 {
                    weight = roundToPlate(oneRm * (Double(pct) / 100.0) * weightPctFactor)
                }
            case .targetWeight:
                if let target = e.targetWeight {
                    weight = roundToPlate(target * weightPctFactor)
                }
            }
            return WorkoutSet(type: .normal, weight: weight, reps: reps, completed: false)
        }

        return WorkoutExercise(
            exerciseName: e.exerciseName,
            primaryMuscle: e.primaryMuscle,
            groupType: e.groupType,
            restSeconds: e.restSeconds,
            isTimeBased: e.isTimeBased,
            loadNote: loadNote,
            sets: sets
        )
    }

    return (weekIndex, exercises)
}

private extension Double {
    func rounded(toNearest step: Double) -> Double {
        guard step > 0 else { return self }
        return (self / step).rounded() * step
    }
    func rounded(to precision: Double) -> Double {
        guard precision > 0 else { return self }
        let scale = 1.0 / precision
        return (self * scale).rounded() / scale
    }
}
