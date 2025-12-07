
'use client'

import { useState, useEffect, useMemo } from "react";
import { Card, CardDescription, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BadgeCheck, CheckCircle, FileQuestion, Loader2, MessageSquareHeart, Users, Search, X, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInterviewQuestions } from "@/lib/firestore-interview-questions";
import type { InterviewQuestion } from "@/lib/types";

const categories = [
    {
        title: "Answered Questions",
        description: "View all of your feedback and answered questions.",
        icon: <CheckCircle className="h-6 w-6" />,
        color: "bg-gray-800 border-gray-700",
        buttonText: "View your questions",
        href: "/interview-practice/answered",
    },
    {
        title: "Recommended",
        description: "Our top questions to help you get hired.",
        icon: <BadgeCheck className="h-6 w-6" />,
        color: "bg-purple-800/20 border-purple-600/50",
        buttonText: "View recommended",
        href: "#",
    },
    {
        title: "Community Favorites",
        description: "Our top questions voted on by our users.",
        icon: <MessageSquareHeart className="h-6 w-6" />,
        color: "bg-green-800/20 border-green-600/50",
        buttonText: "View favorites",
        href: "#",
    },
    {
        title: "Essentials",
        description: "A list of must-practice questions before your interview.",
        icon: <FileQuestion className="h-6 w-6" />,
        color: "bg-blue-800/20 border-blue-600/50",
        buttonText: "View our essentials",
        href: "#",
    },
];

export default function InterviewPracticePage() {
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
    const [selectedTag, setSelectedTag] = useState<string>("all");

    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            try {
                const fetchedQuestions = await getInterviewQuestions();
                setQuestions(fetchedQuestions);
            } catch (error) {
                console.error("Failed to fetch interview questions:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Get all unique tags from questions
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        questions.forEach(q => {
            q.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [questions]);

    // Filter questions based on search and filters
    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            // Search filter
            const matchesSearch = searchQuery === "" || 
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                q.company?.toLowerCase().includes(searchQuery.toLowerCase());

            // Category filter
            const matchesCategory = selectedCategory === "all" || q.category === selectedCategory;

            // Type filter
            const matchesType = selectedType === "all" || q.type === selectedType;

            // Difficulty filter
            const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;

            // Tag filter
            const matchesTag = selectedTag === "all" || q.tags?.includes(selectedTag);

            return matchesSearch && matchesCategory && matchesType && matchesDifficulty && matchesTag;
        });
    }, [questions, searchQuery, selectedCategory, selectedType, selectedDifficulty, selectedTag]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategory("all");
        setSelectedType("all");
        setSelectedDifficulty("all");
        setSelectedTag("all");
    };

    const hasActiveFilters = searchQuery !== "" || 
        selectedCategory !== "all" || 
        selectedType !== "all" || 
        selectedDifficulty !== "all" || 
        selectedTag !== "all";

    return (
        <div className="container mx-auto max-w-7xl py-12 px-4 space-y-12">
            <header className="text-center">
                <h1 className="text-5xl font-bold font-headline tracking-tighter">
                    Be 5x more prepared for your next interview
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Explore our extensive question library. Get immediate, AI-powered feedback to refine your answers and enhance your interview readiness.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, i) => (
                    <Card key={i} className={`flex flex-col ${cat.color} text-white`}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                {cat.icon}
                                <CardTitle className="font-headline text-2xl">{cat.title}</CardTitle>
                            </div>
                            <CardDescription className="text-gray-300 pt-2">{cat.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="mt-auto">
                            <Button asChild className="w-full text-center bg-white/10 p-2 rounded-md hover:bg-white/20 transition-colors">
                                <Link href={cat.href}>
                                  {cat.buttonText}
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search and Filter Section */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-bold font-headline">Search & Filter Questions</h2>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions, tags, or companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="Technical">Technical</SelectItem>
                                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Type</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="Backend">Backend</SelectItem>
                                    <SelectItem value="Frontend">Frontend</SelectItem>
                                    <SelectItem value="Full Stack">Full Stack</SelectItem>
                                    <SelectItem value="DevOps">DevOps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Difficulty</Label>
                            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Tag</Label>
                            <Select value={selectedTag} onValueChange={setSelectedTag}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Tags" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tags</SelectItem>
                                    {allTags.map(tag => (
                                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Active Filters and Clear Button */}
                    {hasActiveFilters && (
                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-muted-foreground">Active filters:</span>
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: "{searchQuery}"
                                        <button onClick={() => setSearchQuery("")} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {selectedCategory !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Category: {selectedCategory}
                                        <button onClick={() => setSelectedCategory("all")} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {selectedType !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Type: {selectedType}
                                        <button onClick={() => setSelectedType("all")} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {selectedDifficulty !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Difficulty: {selectedDifficulty}
                                        <button onClick={() => setSelectedDifficulty("all")} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {selectedTag !== "all" && (
                                    <Badge variant="secondary" className="gap-1">
                                        Tag: {selectedTag}
                                        <button onClick={() => setSelectedTag("all")} className="ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                    )}

                    {/* Results Count */}
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredQuestions.length} of {questions.length} questions
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                 {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map(q => (
                        <Card key={q.id} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold">{q.question}</h3>
                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                        <Badge variant="outline">{q.category}</Badge>
                                        <Badge variant="secondary">{q.type}</Badge>
                                        <Badge variant="secondary" className="bg-yellow-400/10 text-yellow-300">{q.difficulty}</Badge>
                                        {q.company && <Badge variant="secondary" className="bg-blue-400/10 text-blue-300">{q.company}</Badge>}
                                        {q.tags?.map(tag => <Badge key={tag} variant="ghost" className="bg-gray-700/50 text-gray-300">{tag}</Badge>)}
                                    </div>
                                </div>
                                <Link href={`/interview-practice/${q.id}`}>
                                    <Button>
                                        Practice <ArrowRight className="ml-2" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        {hasActiveFilters ? (
                            <div className="space-y-4">
                                <p>No questions match your current filters.</p>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            "No questions found. Check back later!"
                        )}
                    </div>
                )}
            </div>

        </div>
    )
}
