import Foundation
import SwiftData

@Model
final class Workout {
    @Attribute(.unique) var id: UUID
    var date: Date
    var gymProfileId: UUID?
    @Relationship(deleteRule: .cascade) var exercises: [WorkoutExercise]

    init(date: Date = .now, gymProfileId: UUID? = nil, exercises: [WorkoutExercise] = []) {
        self.id = UUID()
        self.date = date
        self.gymProfileId = gymProfileId
        self.exercises = exercises
    }
}

enum SetType: String, Codable {
    case normal
    case warmup
}

@Model
final class WorkoutSet {
    var type: SetType
    var weight: Double?
    var reps: Int?
    var completed: Bool

    init(type: SetType = .normal, weight: Double? = nil, reps: Int? = nil, completed: Bool = false) {
        self.type = type
        self.weight = weight
        self.reps = reps
        self.completed = completed
    }
}

enum GroupType: String, Codable {
    case normal
    case superset
    case dropset
}

@Model
final class WorkoutExercise {
    var exerciseName: String
    var primaryMuscle: String?
    var groupType: GroupType
    var restSeconds: Int
    var isTimeBased: Bool
    var loadNote: String?
    @Relationship(deleteRule: .cascade) var sets: [WorkoutSet]

    init(exerciseName: String,
         primaryMuscle: String? = nil,
         groupType: GroupType = .normal,
         restSeconds: Int = 120,
         isTimeBased: Bool = false,
         loadNote: String? = nil,
         sets: [WorkoutSet] = []) {
        self.exerciseName = exerciseName
        self.primaryMuscle = primaryMuscle
        self.groupType = groupType
        self.restSeconds = restSeconds
        self.isTimeBased = isTimeBased
        self.loadNote = loadNote
        self.sets = sets
    }
}

// Templates (you can persist these as models if you want; keeping them as value types here)
enum LoadType: String, Codable {
    case percent1RM
    case targetWeight
}

struct RoutineExercise: Codable, Identifiable {
    var id = UUID()
    var exerciseName: String
    var primaryMuscle: String?
    var groupType: GroupType = .normal
    var restSeconds: Int = 120
    var isTimeBased: Bool = false
    var loadType: LoadType = .targetWeight
    var targetReps: Int = 5
    var targetSets: Int = 3
    var weightPercent: Int? // when loadType == .percent1RM
    var targetWeight: Double? // when loadType == .targetWeight
}

struct PeriodizationWeek: Codable {
    var weightPct: Int = 100   // e.g., 90 means 90%
    var repsFactor: Double = 1 // e.g., 0.9 reduces reps
}

struct Periodization: Codable {
    var enabled: Bool = false
    var weeks: [PeriodizationWeek] = []
}
